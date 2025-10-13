import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/auth";

// Routes that require authentication (protected routes)
const protectedRoutes = [
  "/client1",
  "/client2",
  "/users",
  "/account",
  "/setting",
  "/unauthorized",
];

// Routes that should redirect if already logged in
const authRoutes = ["/login", "/signup"];

// Admin-only routes
const adminOnlyRoutes = ["/users"];

// Role-specific allowed routes
const roleRoutes: Record<string, string[]> = {
  admin: [
    "/",
    "/users",
    "/client1",
    "/client2",
    "/account",
    "/setting",
    "/unauthorized",
  ],
  client1: ["/", "/client1", "/account", "/setting", "/unauthorized"],
  client2: ["/", "/client2", "/account", "/setting", "/unauthorized"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the route is an auth route (login/signup)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const session = await getSession();

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if accessing auth routes with active session
  if (isAuthRoute && session) {
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    } else if (session.role === "client1") {
      return NextResponse.redirect(new URL("/client1", request.url));
    } else if (session.role === "client2") {
      return NextResponse.redirect(new URL("/client2", request.url));
    }
  }

  // Role-based access control for protected routes
  if (isProtectedRoute && session) {
    const allowedRoutes = roleRoutes[session.role] || [];

    // Check if user is allowed to access this route
    const isAllowed = allowedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (!isAllowed) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Special handling: redirect home page to role-specific page for non-admins
  if (pathname === "/" && session && session.role !== "admin") {
    if (session.role === "client1") {
      return NextResponse.redirect(new URL("/client1", request.url));
    } else if (session.role === "client2") {
      return NextResponse.redirect(new URL("/client2", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)",
  ],
};
