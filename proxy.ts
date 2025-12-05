import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware to handle authentication and redirects
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  // Define protected routes (routes that require authentication)
  const protectedRoutes = ["/dashboard", "/strategy-period"];

  // Define public routes (routes that don't require authentication)
  const publicRoutes = ["/auth", "/"];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // Handle authentication logic
  if (isProtectedRoute) {
    // Protected route - requires authentication
    if (!accessToken) {
      // No token found, redirect to auth
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(authUrl);
    }
    // Token exists, allow access to protected route
    return NextResponse.next();
  }

  if (pathname === "/auth") {
    // Auth page - redirect to dashboard if already authenticated
    if (accessToken) {
      const redirectUrl =
        request.nextUrl.searchParams.get("redirect") || "/strategy-period";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    // Not authenticated, allow access to auth page
    return NextResponse.next();
  }

  if (pathname === "/") {
    // Root page - redirect based on authentication status
    if (accessToken) {
      return NextResponse.redirect(new URL("/strategy-period", request.url));
    } else {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  // For all other routes, allow access
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public files (images, etc.)
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
