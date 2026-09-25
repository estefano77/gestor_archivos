import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userPayload = await getRequestUser(req);

    if (!userPayload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(userPayload.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error al obtener sesión:", error);
    return NextResponse.json(
      { error: "Error al validar la sesión" },
      { status: 500 }
    );
  }
}
