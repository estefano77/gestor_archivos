import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Folder from "@/models/Folder";
import FileItem from "@/models/FileItem";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(user.userId);

    // Fetch user's folders
    const folders = await Folder.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate file count and size per folder
    const fileStats = await FileItem.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: { $ifNull: ["$folder", ""] },
          count: { $sum: 1 },
          totalBytes: { $sum: "$size" },
        },
      },
    ]);

    const statsMap: Record<string, { count: number; totalBytes: number }> = {};
    let unorganizedCount = 0;
    let unorganizedBytes = 0;

    fileStats.forEach((stat) => {
      const folderKey = stat._id ? stat._id.trim() : "";
      if (folderKey === "") {
        unorganizedCount += stat.count;
        unorganizedBytes += stat.totalBytes;
      } else {
        statsMap[folderKey] = {
          count: stat.count,
          totalBytes: stat.totalBytes,
        };
      }
    });

    const foldersWithStats = folders.map((f) => ({
      _id: f._id.toString(),
      name: f.name,
      color: f.color || "indigo",
      description: f.description || "",
      fileCount: statsMap[f.name]?.count || 0,
      totalBytes: statsMap[f.name]?.totalBytes || 0,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({
      folders: foldersWithStats,
      unorganized: {
        fileCount: unorganizedCount,
        totalBytes: unorganizedBytes,
      },
    });
  } catch (error: unknown) {
    console.error("Error al obtener carpetas:", error);
    return NextResponse.json(
      { error: "Error al obtener las carpetas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la carpeta es obligatorio" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 60) {
      return NextResponse.json(
        { error: "El nombre no puede superar los 60 caracteres" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(user.userId);

    // Case-insensitive duplicate check
    const existing = await Folder.findOne({
      userId: userObjectId,
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe una carpeta con el nombre "${trimmedName}"` },
        { status: 409 }
      );
    }

    const validColors = ["indigo", "emerald", "amber", "rose", "purple", "sky"];
    const folderColor = validColors.includes(color) ? color : "indigo";

    const newFolder = await Folder.create({
      userId: userObjectId,
      name: trimmedName,
      color: folderColor,
      description: typeof description === "string" ? description.trim() : "",
    });

    return NextResponse.json(
      {
        message: "Carpeta creada exitosamente",
        folder: {
          _id: newFolder._id.toString(),
          name: newFolder.name,
          color: newFolder.color,
          description: newFolder.description,
          fileCount: 0,
          totalBytes: 0,
          createdAt: newFolder.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error al crear carpeta:", error);
    return NextResponse.json(
      { error: "Error al crear la carpeta" },
      { status: 500 }
    );
  }
}
