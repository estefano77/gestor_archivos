import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_jwt_key_at_least_32_chars_long_123456";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export const AUTH_COOKIE_NAME = "gestor_auth_token";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
  avatarColor?: string;
  [key: string]: unknown;
}

/**
 * Signs a JWT with 7-day expiration
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/**
 * Verifies a JWT token and returns the payload or null
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Extracts and verifies the user session from server-side cookies
 */
export async function getSessionUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Extracts user from an incoming NextRequest (useful in Route Handlers & Middleware)
 */
export async function getRequestUser(
  req: NextRequest
): Promise<TokenPayload | null> {
  const token =
    req.cookies.get(AUTH_COOKIE_NAME)?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;
  return await verifyToken(token);
}
