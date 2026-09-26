import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import FileItem from "@/models/FileItem";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    // Ensure access control: file must belong to current user
    const deletedFile = await FileItem.findOneAndDelete({
      _id: id,
      userId: user.userId,
    });

    if (!deletedFile) {
      return NextResponse.json(
        { error: "Archivo no encontrado o no tienes permiso para eliminarlo" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Archivo eliminado correctamente",
      id,
    });
  } catch (error: unknown) {
    console.error("Error al eliminar archivo:", error);
    return NextResponse.json(
      { error: "Error al eliminar el archivo" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { originalName, description, tags, folder } = body;

    await connectToDatabase();

    const updateFields: Record<string, unknown> = {};
    if (typeof originalName === "string" && originalName.trim()) {
      updateFields.originalName = originalName.trim();
    }
    if (typeof description === "string") {
      updateFields.description = description.trim();
    }
    if (Array.isArray(tags)) {
      updateFields.tags = tags;
    }
    if (typeof folder === "string") {
      const folderName = folder.trim();
      updateFields.folder = folderName;

      // If a non-empty folder name is specified, make sure it exists in Folder collection
      if (folderName) {
        const Folder = (await import("@/models/Folder")).default;
        const existing = await Folder.findOne({
          userId: user.userId,
          name: { $regex: new RegExp(`^${folderName}$`, "i") },
        });
        if (!existing) {
          await Folder.create({
            userId: user.userId,
            name: folderName,
            color: "indigo",
          });
        }
      }
    }

    const updated = await FileItem.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: updateFields },
      { new: true }
    ).select("-fileData");

    if (!updated) {
      return NextResponse.json(
        { error: "Archivo no encontrado o no tienes permiso para modificarlo" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Archivo actualizado con éxito",
      file: {
        _id: updated._id.toString(),
        originalName: updated.originalName,
        mimeType: updated.mimeType,
        category: updated.category,
        size: updated.size,
        folder: updated.folder || "",
        description: updated.description,
        tags: updated.tags,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error al actualizar archivo:", error);
    return NextResponse.json(
      { error: "Error al actualizar archivo" },
      { status: 500 }
    );
  }
}
