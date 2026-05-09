import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "local_dev_secret_do_not_use_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export type Role = "admin" | "pm" | "subcontractor";

export interface TokenPayload {
  userId: string;
  role: Role;
}

export function signToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

function extractToken(request: NextRequest | Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) return auth.substring(7);

  // Fallback: cookie named "token" (UI uses localStorage + Authorization header,
  // but middleware checks cookie as backup)
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return null;
}

export async function getSessionUser(request: NextRequest | Request) {
  const token = extractToken(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  return user;
}

export function requireRole(
  user: { role: string } | null,
  allowed: Role[]
): { ok: boolean; status: number; error?: string } {
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if (!allowed.includes(user.role as Role))
    return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, status: 200 };
}

export function apiResponse<T>(
  data: T | null,
  error: string | null,
  status = 200
) {
  return Response.json({ data, error, status }, { status });
}
