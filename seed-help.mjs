/**
 * Siembra y limpieza de los datos de muestra que usa el manual de usuario.
 *
 * El manual se ilustra con capturas reales de la interfaz, y para que las
 * capturas no salgan vacias hace falta una cuenta con archivos de los cinco
 * tipos admitidos y algunas carpetas tematicas.
 *
 *   node seed-help.mjs            siembra los datos de muestra
 *   node seed-help.mjs --clean    borra unicamente lo que creo este script
 *   node seed-help.mjs --reset    borra y vuelve a sembrar
 *
 * Todo queda colgando de un unico usuario (SEED_EMAIL), asi que la limpieza
 * se hace por su `userId` y no puede tocar los datos reales de la base.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const SEED_EMAIL = "ayuda@cloudvault.app";
const SEED_NAME = "Usuario de Ayuda";
const SEED_PASSWORD = "ayuda123456";
const SAMPLES_DIR = ".help-samples";

/** Archivos de muestra: nombre en disco -> como se presenta en la interfaz. */
const SEED_FILES = [
  {
    file: "Informe-Trimestral.pdf",
    mimeType: "application/pdf",
    category: "pdf",
    folder: "Contratos",
    description: "Informe trimestral de actividad",
    tags: ["informe", "2026", "reporte"],
  },
  {
    file: "Contrato-Servicios.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    category: "word",
    folder: "Contratos",
    description: "Borrador del contrato anual",
    tags: ["contrato", "borrador"],
  },
  {
    file: "Presupuesto-Anual.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    category: "excel",
    folder: "Finanzas",
    description: "Presupuesto por partidas",
    tags: ["finanzas", "presupuesto"],
  },
  {
    file: "Presentacion-Resultados.pptx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    category: "powerpoint",
    folder: "Presentaciones",
    description: "Resultados del trimestre",
    tags: ["presentacion"],
  },
  {
    // Se deja sin carpeta a proposito para que el manual pueda mostrar el
    // estado "Sin carpeta" con un archivo real.
    file: "Captura-De-Pantalla.png",
    mimeType: "image/png",
    category: "image",
    folder: "",
    description: "Imagen de ejemplo",
    tags: ["captura"],
  },
];

const SEED_FOLDERS = [
  { name: "Contratos", color: "indigo", description: "Documentos firmados" },
  { name: "Finanzas", color: "emerald", description: "Presupuestos y facturas" },
  { name: "Presentaciones", color: "amber", description: "Material de reuniones" },
];

function readMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const match = readFileSync(".env.local", "utf8").match(/^MONGODB_URI=(.+)$/m);
  if (!match) {
    throw new Error("No se encontro MONGODB_URI en .env.local");
  }
  return match[1].trim();
}

async function countAll(db) {
  return {
    usuarios: await db.collection("users").countDocuments(),
    archivos: await db.collection("fileitems").countDocuments(),
    carpetas: await db.collection("folders").countDocuments(),
  };
}

async function cleanSeedData(db) {
  const user = await db
    .collection("users")
    .findOne({ email: SEED_EMAIL });

  if (!user) {
    console.log("No hay datos de siembra que borrar.");
    return;
  }

  const archivos = await db
    .collection("fileitems")
    .deleteMany({ userId: user._id });
  const carpetas = await db
    .collection("folders")
    .deleteMany({ userId: user._id });
  const usuarios = await db.collection("users").deleteOne({ _id: user._id });

  console.log(`Borrado de la siembra "${SEED_EMAIL}":`);
  console.log(`  archivos .......... ${archivos.deletedCount}`);
  console.log(`  carpetas .......... ${carpetas.deletedCount}`);
  console.log(`  usuarios .......... ${usuarios.deletedCount}`);
}

async function seed(db) {
  const existing = await db.collection("users").findOne({ email: SEED_EMAIL });
  if (existing) {
    console.log(
      `La cuenta "${SEED_EMAIL}" ya existe. Use --reset para regenerarla.`
    );
    return;
  }

  if (!existsSync(SAMPLES_DIR)) {
    throw new Error(
      `Falta el directorio "${SAMPLES_DIR}". Genere los archivos con:\n` +
        `  python seed-help-samples.py ${SAMPLES_DIR}`
    );
  }

  const disponibles = new Set(readdirSync(SAMPLES_DIR));
  for (const item of SEED_FILES) {
    if (!disponibles.has(item.file)) {
      throw new Error(
        `Falta el archivo de muestra "${item.file}". Genere los archivos con:\n` +
          `  python seed-help-samples.py ${SAMPLES_DIR}`
      );
    }
  }

  const user = await db.collection("users").insertOne({
    name: SEED_NAME,
    email: SEED_EMAIL,
    password: await bcrypt.hash(SEED_PASSWORD, 10),
    avatarColor: "#0ea5e9",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`Usuario creado: ${SEED_EMAIL} (contrasena: ${SEED_PASSWORD})`);

  for (const folder of SEED_FOLDERS) {
    await db.collection("folders").insertOne({
      userId: user.insertedId,
      name: folder.name,
      color: folder.color,
      description: folder.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`Carpetas creadas: ${SEED_FOLDERS.map((f) => f.name).join(", ")}`);

  let totalBytes = 0;
  for (const item of SEED_FILES) {
    const fileData = readFileSync(join(SAMPLES_DIR, item.file));
    totalBytes += fileData.length;

    await db.collection("fileitems").insertOne({
      userId: user.insertedId,
      originalName: item.file,
      mimeType: item.mimeType,
      category: item.category,
      size: fileData.length,
      folder: item.folder,
      fileData,
      description: item.description,
      tags: item.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const destino = item.folder ? `-> ${item.folder}` : "-> Sin carpeta";
    console.log(`  ${item.file.padEnd(30)} ${destino}`);
  }

  console.log(
    `Archivos creados: ${SEED_FILES.length} (${totalBytes.toLocaleString(
      "es-ES"
    )} bytes en total)`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const wantsClean = args.includes("--clean");
  const wantsReset = args.includes("--reset");

  await mongoose.connect(readMongoUri(), { bufferCommands: false });
  const db = mongoose.connection.db;

  console.log(`Base de datos: ${db.databaseName}\n`);
  const antes = await countAll(db);
  console.log("Estado previo:");
  console.log(`  ${JSON.stringify(antes)}\n`);

  if (wantsClean) {
    await cleanSeedData(db);
  }
  if (!wantsClean || wantsReset) {
    if (wantsReset) {
      await cleanSeedData(db);
      console.log("");
    }
    await seed(db);
  }

  const despues = await countAll(db);
  console.log("\nEstado posterior:");
  console.log(`  ${JSON.stringify(despues)}\n`);
  console.log(
    "Las diferencias corresponden unicamente a los datos de esta siembra."
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("\nError:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
