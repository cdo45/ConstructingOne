import { prisma } from "@/lib/db";
import { signToken, apiResponse, Role } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return apiResponse(null, "Email and password required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() }
    });
    if (!user) return apiResponse(null, "Invalid credentials", 401);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return apiResponse(null, "Invalid credentials", 401);

    const token = signToken(user.id, user.role as Role);

    return apiResponse(
      {
        token,
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        companyName: user.companyName
      },
      null,
      200
    );
  } catch (e) {
    console.error(e);
    return apiResponse(null, "Login failed", 500);
  }
}
