import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for authentication and authorization
 * Runs at the edge before requests reach the page
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get access token from cookies
  const token = request.cookies.get("accessToken")?.value;

  // Auth pages (should redirect to home if already logged in)
  const authPaths = ["/login", "/register"];

  // Check if current path is an auth page
  const isAuthPath = authPaths.some((path) => pathname === path);

  // Redirect to home if accessing auth pages while logged in
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Auth pages
    "/login",
    "/register",
  ],
};
