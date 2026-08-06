import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";
import {
  canRoleAccessRoute,
  getRouteRoleRequirement,
  isProtectedRoute,
} from "./src/lib/rbac/routePolicy";

// JWT payload structure
interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}



/**
 * Decode JWT token and get role
 */
function getRoleFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JWTPayload>(token);

    // Check if token is expired
    const now = Date.now() / 1000;
    if (decoded.exp < now) {
      return null;
    }

    return decoded.role;
  } catch {
    return null;
  }
}

// Proxy to handle authentication and role-based access control
// Note: Next.js 16 expects this to be exported as "proxy" when the file is named proxy.ts
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  // Handle authentication logic
  if (isProtectedRoute(pathname)) {
    // Protected route - requires authentication
    if (!accessToken) {
      // No token found, redirect to auth
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(authUrl);
    }

    // Get role from token
    const userRole = getRoleFromToken(accessToken);

    // If token is invalid or expired, redirect to auth
    if (!userRole) {
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("redirect", pathname);
      authUrl.searchParams.set("expired", "true");
      // Clear the invalid token
      const response = NextResponse.redirect(authUrl);
      response.cookies.delete("accessToken");
      return response;
    }

    // Check role-based access
    if (!canRoleAccessRoute(userRole, pathname)) {
      // User doesn't have permission - redirect to dashboard with error
      const dashboardUrl = new URL("/dashboard", request.url);
      const requiredRole = getRouteRoleRequirement(pathname);
      dashboardUrl.searchParams.set("access_denied", "true");
      if (requiredRole) {
        dashboardUrl.searchParams.set("required_role", requiredRole);
      }
      return NextResponse.redirect(dashboardUrl);
    }

    // Token is valid and user has permission, allow access
    return NextResponse.next();
  }

  if (pathname === "/auth") {
    // Auth page - redirect to dashboard if already authenticated
    if (accessToken) {
      const userRole = getRoleFromToken(accessToken);
      if (userRole) {
        const redirectUrl =
          request.nextUrl.searchParams.get("redirect") || "/strategy-period";
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
      // Token is invalid, clear it and stay on auth page
      const response = NextResponse.next();
      response.cookies.delete("accessToken");
      return response;
    }
    // Not authenticated, allow access to auth page
    return NextResponse.next();
  }

  if (pathname === "/") {
    // Root page - redirect based on authentication status
    if (accessToken) {
      const userRole = getRoleFromToken(accessToken);
      if (userRole) {
        return NextResponse.redirect(new URL("/strategy-period", request.url));
      }
      // Token is invalid, redirect to auth
      const response = NextResponse.redirect(new URL("/auth", request.url));
      response.cookies.delete("accessToken");
      return response;
    } else {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  // For all other routes, allow access
  return NextResponse.next();
}

// Configure which routes the proxy should run on
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
