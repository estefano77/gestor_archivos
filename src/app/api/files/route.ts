import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getRequestUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import FileItem from "@/models/FileItem";
import Folder from "@/models/Folder";
import {
  getFileCategory,
  FileCategory,
  MAX_FILE_SIZE,
  USER_QUOTA_BYTES,
  formatBytes,
} from "@/lib/file-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const folder = searchParams.get("folder");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";

    // Strictly filter by current user's ID
    const query: Record<string, unknown> = { userId: user.userId };

    if (category && category !== "all") {
      query.category = category as FileCategory;
    }

    if (folder && folder !== "all") {
      if (folder === "none" || folder === "unorganized") {
        query.$or = [
          { folder: "" },
          { folder: { $exists: false } },
          { folder: null },
        ];
      } else {
        query.folder = folder;
      }
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      const searchConditions: Record<string, unknown>[] = [
        { originalName: regex },
        { tags: regex },
        { description: regex },
        { folder: regex },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    else if (sort === "name") sortOptions = { originalName: 1 };
    else if (sort === "size_desc") sortOptions = { size: -1 };
    else if (sort === "size_asc") sortOptions = { size: 1 };

    // Exclude heavy binary fileData from list responses
    const files = await FileItem.find(query)
      .select("-fileData")
      .sort(sortOptions)
      .lean();

    return NextResponse.json({
      files: files.map((f) => ({
        _id: f._id.toString(),
        originalName: f.originalName,
        mimeType: f.mimeType,
        category: f.category,
        size: f.size,
        folder: f.folder || "",
        description: f.description,
        tags: f.tags,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
    });
  } catch (error: unknown) {
    console.error("Error al obtener archivos:", error);
    return NextResponse.json(
      { error: "Error al cargar la lista de archivos" },
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const description = (formData.get("description") as string) || "";
    const tagsRaw = (formData.get("tags") as string) || "";
    const folderRaw = (formData.get("folder") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `El archivo supera el límite de 15MB permitido (Tamaño: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(1)}MB)`,
        },
        { status: 400 }
      );
    }

    const category = getFileCategory(file.type, file.name);

    // Verify allowed types: PDF, Images, Word, Excel, PowerPoint
    const allowedCategories: FileCategory[] = [
      "pdf",
      "image",
      "word",
      "excel",
      "powerpoint",
    ];
    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        {
          error:
            "Formato no permitido. Solo se aceptan archivos PDF, imágenes, Word (.doc, .docx), Excel (.xls, .xlsx) y PowerPoint (.ppt, .pptx).",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Enforce the per-user storage quota. This check is the authoritative one;
    // the client-side validation in FileUploadModal only gives fast feedback.
    const userObjectId = new mongoose.Types.ObjectId(user.userId);
    const [usage] = await FileItem.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$size" } } },
    ]);
    const usedBytes: number = usage?.total || 0;

    if (usedBytes + file.size > USER_QUOTA_BYTES) {
      const remaining = Math.max(0, USER_QUOTA_BYTES - usedBytes);
      return NextResponse.json(
        {
          error:
            remaining === 0
              ? `Has alcanzado tu cuota de ${formatBytes(
                  USER_QUOTA_BYTES
                )}. Elimina algún archivo para liberar espacio.`
              : `No hay espacio suficiente en tu cuota. Quedan ${formatBytes(
                  remaining
                )} y este archivo ocupa ${formatBytes(file.size)}. Elimina algún archivo para liberar espacio.`,
        },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const folderName = folderRaw.trim();

    // If a folder name was provided, ensure it exists in Folder collection
    if (folderName) {
      const existingFolder = await Folder.findOne({
        userId: user.userId,
        name: { $regex: new RegExp(`^${folderName}$`, "i") },
      });
      if (!existingFolder) {
        await Folder.create({
          userId: user.userId,
          name: folderName,
          color: "indigo",
        });
      }
    }

    const newFile = await FileItem.create({
      userId: user.userId,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      category,
      size: file.size,
      // Always store folder explicitly (even as empty string) to avoid UNDEFINED in MongoDB
      folder: folderName || "",
      fileData: buffer,
      description: description.trim(),
      tags,
    });

    return NextResponse.json(
      {
        message: "Archivo subido correctamente",
        file: {
          _id: newFile._id.toString(),
          originalName: newFile.originalName,
          mimeType: newFile.mimeType,
          category: newFile.category,
          size: newFile.size,
          folder: newFile.folder || "",
          description: newFile.description,
          tags: newFile.tags,
          createdAt: newFile.createdAt,
          updatedAt: newFile.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error al subir archivo:", error);
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
