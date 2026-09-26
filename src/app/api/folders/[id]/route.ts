import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Folder from "@/models/Folder";
import FileItem from "@/models/FileItem";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, color, description } = body;

    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(user.userId);

    const folder = await Folder.findOne({ _id: id, userId: userObjectId });
    if (!folder) {
      return NextResponse.json(
        { error: "Carpeta no encontrada" },
        { status: 404 }
      );
    }

    const oldName = folder.name;
    let newName = oldName;

    if (name && typeof name === "string" && name.trim()) {
      newName = name.trim();
      if (newName.toLowerCase() !== oldName.toLowerCase()) {
        const existing = await Folder.findOne({
          userId: userObjectId,
          name: { $regex: new RegExp(`^${newName}$`, "i") },
        });
        if (existing) {
          return NextResponse.json(
            { error: `Ya existe una carpeta con el nombre "${newName}"` },
            { status: 409 }
          );
        }
      }
      folder.name = newName;
    }

    if (color && typeof color === "string") {
      const validColors = ["indigo", "emerald", "amber", "rose", "purple", "sky"];
      if (validColors.includes(color)) {
        folder.color = color;
      }
    }

    if (typeof description === "string") {
      folder.description = description.trim();
    }

    await folder.save();

    // If folder was renamed, update all associated files
    if (newName !== oldName) {
      await FileItem.updateMany(
        { userId: userObjectId, folder: oldName },
        { $set: { folder: newName } }
      );
    }

    return NextResponse.json({
      message: "Carpeta actualizada con éxito",
      folder: {
        _id: folder._id.toString(),
        name: folder.name,
        color: folder.color,
        description: folder.description,
      },
    });
  } catch (error: unknown) {
    console.error("Error al actualizar carpeta:", error);
    return NextResponse.json(
      { error: "Error al actualizar la carpeta" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(user.userId);

    const folder = await Folder.findOneAndDelete({
      _id: id,
      userId: userObjectId,
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Carpeta no encontrada" },
        { status: 404 }
      );
    }

    // Delete all files belonging to this folder as requested
    const deleteResult = await FileItem.deleteMany({
      userId: userObjectId,
      folder: folder.name,
    });

    return NextResponse.json({
      message: `Carpeta "${folder.name}" y sus ${deleteResult.deletedCount} archivo(s) asociados fueron eliminados correctamente.`,
      id,
      deletedFilesCount: deleteResult.deletedCount,
    });
  } catch (error: unknown) {
    console.error("Error al eliminar carpeta:", error);
    return NextResponse.json(
      { error: "Error al eliminar la carpeta" },
      { status: 500 }
    );
  }
}
