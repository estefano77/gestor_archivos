import mongoose from "mongoose";
import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf8");
const match = envContent.match(/^MONGODB_URI=(.+)$/m);
const MONGODB_URI = match ? match[1].trim() : "";

await mongoose.connect(MONGODB_URI, { bufferCommands: false });
const db = mongoose.connection.db;

const fileItems = await db.collection("fileitems").find({}, { projection: { fileData: 0 } }).toArray();
const folders = await db.collection("folders").find({}).toArray();

console.log("\n=== FILEITEMS EN BD ===");
fileItems.forEach((f, i) => {
  const fv = f.folder;
  const status = fv === undefined ? "⚠️ UNDEFINED" : fv === null ? "⚠️ NULL" : fv === "" ? "📂 (vacío)" : `📁 "${fv}"`;
  console.log(`[${i+1}] ${f.originalName}`);
  console.log(`     folder: ${status}`);
  console.log(`     updatedAt: ${f.updatedAt}`);
});

console.log("\n=== FOLDERS EN BD ===");
folders.forEach((f, i) => {
  console.log(`[${i+1}] "${f.name}" color:${f.color}`);
});

console.log("\n=== CRUCE ===");
const grouped = {};
fileItems.forEach(f => {
  const k = (!f.folder && f.folder !== "") ? "(UNDEFINED/NULL)" : f.folder === "" ? "(sin carpeta)" : f.folder;
  if (!grouped[k]) grouped[k] = [];
  grouped[k].push(f.originalName);
});
Object.entries(grouped).forEach(([k, v]) => console.log(`${k}: ${v}`));

await mongoose.disconnect();
