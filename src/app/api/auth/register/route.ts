import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { isLocalEnabled } from "@/lib/auth-config";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#3b82f6", // Blue
];

export async function POST(req: NextRequest) {
  try {
    // El registro con contraseña solo existe en los modos 0 y 2. Ocultar el
    // formulario no bastaría: esta ruta es pública y se podría llamar a mano.
    if (!isLocalEnabled()) {
      return NextResponse.json(
        { error: "El registro con contraseña está deshabilitado." },
        { status: 403 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Por favor proporciona nombre, correo y contraseña" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo electrónico" },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const randomColor =
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatarColor: randomColor,
      role: "user",
    });

    const token = await signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatarColor: newUser.avatarColor,
    });

    const response = NextResponse.json(
      {
        message: "Registro exitoso",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatarColor: newUser.avatarColor,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    // Un fallo de validación es un error del cliente, no del servidor: se
    // responde 400 con los mensajes del esquema en vez de un 500. Además evita
    // filtrar al cliente el texto crudo del error de Mongoose.
    if (error instanceof mongoose.Error.ValidationError) {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { error: mensajes.join(". ") || "Los datos no son válidos." },
        { status: 400 }
      );
    }

    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
