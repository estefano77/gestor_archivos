import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import {
  verifyGoogleIdToken,
  exchangeCodeForTokens,
  GoogleAuthError,
  type GoogleIdentity,
} from "@/lib/google-auth";
import { OAUTH_STATE_COOKIE } from "../route";
import { isGoogleEnabled } from "@/lib/auth-config";

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

/** Comparación en tiempo constante para no filtrar el valor con los tiempos. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function esErrorDeClaveDuplicada(err: unknown): boolean {
  return (
    err instanceof mongoose.Error &&
    (err as mongoose.Error & { code?: number }).code === 11000
  );
}

/**
 * Localiza la cuenta de Google o la crea.
 *
 * Se busca primero por el identificador de Google (`sub`), que es estable
 * aunque la persona cambie de correo. Si no aparece, se busca por correo: eso
 * convierte una cuenta creada con contraseña en una cuenta con Google, en vez
 * de duplicarla y repartir los archivos entre dos identidades. Es seguro
 * porque Google confirma que el correo está verificado.
 */
async function findOrCreateUser(identity: GoogleIdentity) {
  const porIdDeGoogle = await User.findOne({
    provider: "google",
    providerId: identity.googleId,
  });
  if (porIdDeGoogle) return porIdDeGoogle;

  const porCorreo = await User.findOne({ email: identity.email });
  if (porCorreo) {
    porCorreo.provider = "google";
    porCorreo.providerId = identity.googleId;
    await porCorreo.save();
    return porCorreo;
  }

  try {
    return await User.create({
      name: identity.name,
      email: identity.email,
      provider: "google",
      providerId: identity.googleId,
      // Sin `password`: esta cuenta no tiene contraseña y no debe tenerla.
      avatarColor:
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      role: "user",
    });
  } catch (err) {
    // Dos inicios de sesión simultáneos con el mismo correo pueden chocar con
    // el índice único. Quien haya ganado la carrera ya creó la cuenta.
    if (esErrorDeClaveDuplicada(err)) {
      const recienCreada = await User.findOne({ email: identity.email });
      if (recienCreada) return recienCreada;
    }
    throw err;
  }
}

/** Vuelve a la pantalla de acceso con un mensaje legible. */
function volverConError(mensaje: string, req: NextRequest) {
  const url = new URL("/auth", req.url);
  url.searchParams.set("error", mensaje);
  const response = NextResponse.redirect(url.toString());
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

async function responderConSesion(
  user: {
    _id: mongoose.Types.ObjectId;
    email: string;
    name: string;
    role: "user" | "admin";
    avatarColor?: string;
  },
  req: NextRequest
) {
  const token = await signToken({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    avatarColor: user.avatarColor,
  });

  const response = NextResponse.redirect(new URL("/", req.url).toString());
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Si el administrador pasó a un modo sin Google, una vuelta pendiente de una
  // pestaña ya abierta no debe poder completar el inicio de sesión.
  if (!isGoogleEnabled()) {
    return NextResponse.json(
      { error: "El inicio de sesión con Google está deshabilitado." },
      { status: 403 }
    );
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "El inicio de sesión con Google no está configurado." },
      { status: 503 }
    );
  }

  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");

  // La persona pulsó "Cancelar" en la pantalla de Google.
  if (params.get("error")) {
    return volverConError("Has cancelado el inicio de sesión con Google.", req);
  }

  if (!code || !state) {
    return volverConError("Google no devolvió una respuesta válida.", req);
  }

  // --- Protección CSRF: el `state` debe coincidir con el de nuestra cookie ---
  const expectedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!expectedState || !safeEqual(state, expectedState)) {
    return volverConError(
      "No se pudo verificar el inicio de sesión. Vuelve a intentarlo.",
      req
    );
  }

  try {
    await connectToDatabase();

    const callbackUrl = new URL("/api/auth/google/callback", req.url).toString();

    // --- 1. Canjear el código y verificar la firma del id_token ---
    const { idToken } = await exchangeCodeForTokens(
      code,
      clientId,
      clientSecret,
      callbackUrl
    );
    const identity = await verifyGoogleIdToken(idToken, clientId);

    // --- 2. Localizar o crear la cuenta ---
    const user = await findOrCreateUser(identity);

    // --- 3. Emitir la misma cookie de sesión que usa el login por contraseña ---
    return await responderConSesion(user, req);
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      return volverConError(err.message, req);
    }

    console.error("Error en el inicio de sesión con Google:", err);
    return volverConError(
      "Ha ocurrido un error al iniciar sesión con Google.",
      req
    );
  }
}
