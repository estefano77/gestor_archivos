import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, verifyToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import FileItem from "@/models/FileItem";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    let user = await getRequestUser(req);

    // Support token in query string if opened in a new tab or iframe
    if (!user) {
      const urlToken = req.nextUrl.searchParams.get("token");
      if (urlToken) {
        user = await verifyToken(urlToken);
      }
    }

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const file = await FileItem.findOne({
      _id: id,
      userId: user.userId,
    });

    if (!file || !file.fileData) {
      return NextResponse.json(
        { error: "Archivo no encontrado o sin contenido" },
        { status: 404 }
      );
    }

    // Prepare response with binary file data and inline disposition
    const headers = new Headers();
    headers.set("Content-Type", file.mimeType || "application/octet-stream");
    headers.set("Content-Length", file.size.toString());
    
    // Encode filename for Content-Disposition header
    const encodedFilename = encodeURIComponent(file.originalName);
    headers.set(
      "Content-Disposition",
      `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    headers.set("Cache-Control", "private, max-age=3600");

    // Convert Buffer to Uint8Array for Next Response
    const uint8Array = new Uint8Array(file.fileData);

    return new Response(uint8Array, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error("Error en preview de archivo:", error);
    return NextResponse.json(
      { error: "Error al visualizar el archivo" },
      { status: 500 }
    );
  }
}
