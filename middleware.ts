import { NextRequest, NextResponse } from "next/server";

// Middleware here only guards the UI page paths for simple redirects.
// Page-level and API-level auth enforcement is done inside each route
// using `getSessionUser` + `requireRole` (Edge runtime can't use bcrypt/prisma).
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const publicPaths = ["/login", "/api/auth/login", "/_next", "/favicon.ico"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // API routes handle their own auth
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // For UI pages, the client-side pages check the token in localStorage.
  // We keep middleware minimal here to avoid the edge/node runtime collision
  // with bcrypt/prisma in auth verification.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
