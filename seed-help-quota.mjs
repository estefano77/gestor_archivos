/**
 * Añade archivos de relleno al usuario de la siembra para llegar a un estado
 * concreto de cuota (aviso o agotada) y poder capturarlo para el manual.
 *
 *   node seed-help-quota.mjs 0.85   -> ~85% usado (estado de aviso)
 *   node seed-help-quota.mjs 1.0    -> 100% usado (cuota agotada)
 *   node seed-help-quota.mjs --clear  -> quita el relleno
 *
 * El relleno se guarda con la etiqueta RESERVE_TAG, asi que `--clear` solo
 * toca los archivos que Creo este script.
 */

import mongoose from "mongoose";
import { readFileSync } from "fs";
import { randomBytes } from "crypto";

const SEED_EMAIL = "ayuda@cloudvault.app";
const QUOTA_BYTES = 25 * 1024 * 1024;
const PER_FILE_CAP = 15 * 1024 * 1024;
const RESERVE_TAG = "__cuota__";

function readMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const match = readFileSync(".env.local", "utf8").match(/^MONGODB_URI=(.+)$/m);
  if (!match) throw new Error("No se encontro MONGODB_URI en .env.local");
  return match[1].trim();
}

async function main() {
  const arg = process.argv[2];
  await mongoose.connect(readMongoUri(), { bufferCommands: false });
  const db = mongoose.connection.db;
  const user = await db.collection("users").findOne({ email: SEED_EMAIL });

  if (!user) {
    throw new Error(`No existe la cuenta de siembra ${SEED_EMAIL}. Ejecute seed-help.mjs primero.`);
  }

  const cleared = await db.collection("fileitems").deleteMany({ tags: RESERVE_TAG });
  console.log(`Relleno retirado: ${cleared.deletedCount} archivo(s).`);

  if (arg !== "--clear") {
    const target = Number(arg);
    if (!Number.isFinite(target) || target <= 0 || target > 1) {
      throw new Error("Indique un proportion entre 0 y 1, o --clear");
    }

    // Ojo: con el driver crudo `aggregate()` devuelve un Cursor, hay que
    // materializarlo con toArray() (el aggregate de Mongoose si resuelve solo).
    const actual = await db
      .collection("fileitems")
      .aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: "$size" } } },
      ])
      .toArray();
    const currentBytes = actual[0]?.total || 0;
    const wantBytes = Math.floor(QUOTA_BYTES * target);
    let toAdd = wantBytes - currentBytes;

    if (toAdd < 0) {
      console.log("Los archivos actuales ya superan el objetivo; no se anade relleno.");
    }

    // Nombres y notas verosimiles: el manual muestra el panel de cuota sobre
    // un panel real, y "Reserva-Espacio-01.pdf" delataria que es relleno.
    const FILLER = [
      {
        originalName: "Contrato-Marco-2026.pdf",
        description: "Contrato firmado por ambas partes",
        tags: ["contrato", "2026"],
      },
      {
        originalName: "Anexo-II-Presupuesto.pdf",
        description: "Anexo del presupuesto anual",
        tags: ["finanzas", "anexo"],
      },
    ];

    let n = 0;
    while (toAdd > 0) {
      const size = Math.min(toAdd, PER_FILE_CAP - 1024);
      if (size <= 0) break;
      const sample = FILLER[n % FILLER.length];
      const suffix = n >= FILLER.length ? ` (${Math.floor(n / FILLER.length) + 1})` : "";
      await db.collection("fileitems").insertOne({
        userId: user._id,
        originalName: `${sample.originalName}${suffix}`,
        mimeType: "application/pdf",
        category: "pdf",
        size,
        folder: "",
        // El binario es simbolico: la app no inspecciona el contenido, solo lo
        // almacena y lo sirve. Estos archivos se borran al terminar las capturas.
        fileData: randomBytes(1024),
        description: sample.description,
        tags: [...sample.tags, RESERVE_TAG],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toAdd -= size;
      n += 1;
    }

    const after = await db
      .collection("fileitems")
      .aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: "$size" } } },
      ])
      .toArray();
    const used = after[0]?.total || 0;
    console.log(
      `Relleno anadido: ${n} archivo(s). Uso final: ${(used / 1024 / 1024).toFixed(2)} MB de 25 MB (${(
        (used / QUOTA_BYTES) * 100
      ).toFixed(1)}%).`
    );
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Error:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
