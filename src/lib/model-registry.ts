import mongoose, { Model, Schema } from "mongoose";

/**
 * Normaliza la definición de un esquema para poder compararla de forma estable:
 * los constructores (`String`, `[String]`, …) se sustituyen por su nombre porque
 * `JSON.stringify` los descartaría y la firma quedaría vacía.
 */
function normalize(value: unknown): unknown {
  if (typeof value === "function") {
    return `fn:${(value as { name?: string }).name ?? "anonymous"}`;
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        normalize(val),
      ])
    );
  }
  return value;
}

/**
 * Firma del esquema: definición completa de campos (tipos, enums, defaults,
 * required), opciones declaradas por el desarrollador e índices. Sirve para
 * detectar si el esquema cambió respecto al modelo que está cacheado.
 *
 * Se usa la definición completa y no solo los nombres de los campos porque
 * cambios como agregar un valor a un `enum` no alteran los paths, pero sí
 * hacen que el modelo viejo rechace datos válidos.
 *
 * Importante: se comparan `obj` y `_userProvidedOptions`, y NO `options`.
 * Mongoose modifica `schema.options` al compilar el modelo (por ejemplo añade
 * `pluralization`), así que compararlo daría siempre "distinto" y provocaría
 * una reconstrucción innecesaria del modelo en cada recarga.
 */
function schemaSignature<T>(schema: Schema<T>): string {
  const internals = schema as unknown as {
    obj?: Record<string, unknown>;
    _userProvidedOptions?: Record<string, unknown>;
    indexes: () => unknown;
  };
  return JSON.stringify([
    normalize(internals.obj),
    normalize(internals._userProvidedOptions ?? {}),
    normalize(internals.indexes()),
  ]);
}

/**
 * Registra (o recupera) un modelo de Mongoose de forma segura para el hot-reload
 * de Next.js en desarrollo.
 *
 * ⚠️ Por qué NO basta con `mongoose.models.X || mongoose.model(...)`:
 *
 * `mongoose.models` es una caché que vive en el proceso de Node y **sobrevive a las
 * recargas de módulos** que hace Next.js al guardar un archivo. Si modificas un
 * esquema (por ejemplo, agregar el campo `folder`), el proceso sigue devolviendo el
 * modelo viejo. Como Mongoose trabaja en modo `strict`, cualquier campo que no esté
 * en el esquema cacheado se **descarta en silencio** en `create()` y en los `$set`
 * de `findOneAndUpdate()`, sin lanzar ningún error: los datos simplemente nunca
 * llegan a MongoDB.
 *
 * Por eso, en desarrollo, si el esquema cacheado ya no coincide con el actual se
 * reemplaza el modelo. `deleteModel()` se llama únicamente cuando el modelo existe,
 * porque en Mongoose 9 lanza `MissingSchemaError` si no está registrado en esa
 * conexión (ver `node_modules/mongoose/lib/connection.js`, `deleteModel`).
 *
 * En producción el proceso no recarga módulos, así que se reutiliza el modelo.
 */
export function getOrRegisterModel<T>(
  name: string,
  schema: Schema<T>
): Model<T> {
  const cached = mongoose.models[name] as Model<T> | undefined;

  // No hay nada registrado todavía: se compila y se cachea normalmente.
  if (!cached) {
    return mongoose.model<T>(name, schema);
  }

  // En producción el esquema es fijo: basta con reutilizar el modelo cacheado.
  if (process.env.NODE_ENV === "production") {
    return cached;
  }

  // En desarrollo: si el esquema no cambió, se reutiliza el modelo tal cual.
  if (schemaSignature(cached.schema) === schemaSignature(schema)) {
    return cached;
  }

  // El esquema cambió y la caché de mongoose sobrevive al hot-reload: hay que
  // reemplazar el modelo o Mongoose descartaría en silencio los campos nuevos.
  mongoose.deleteModel(name);
  return mongoose.model<T>(name, schema);
}
