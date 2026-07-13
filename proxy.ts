import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

// JWT payload structure
interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Role hierarchy levels (must match src/lib/rbac/roles.ts)
const ROLE_HIERARCHY: Record<string, number> = {
  NORMAL: 0,
  COORDINATOR: 1,
  MANAGER: 2,
  DIRECTOR: 3,
  HR: 4,
  ADMIN: 5,
  SUPER_ADMIN: 6,
};

// Route permission configuration
// Each route maps to the minimum role required to access it
const ROUTE_PERMISSIONS: Record<string, string> = {
  // Admin routes - require ADMIN or higher
  "/dashboard/admin": "ADMIN",

  // Employee management - require ADMIN or higher
  "/dashboard/employees": "ADMIN",

  // Organizational structure - require DIRECTOR or higher
  "/dashboard/divisions": "DIRECTOR",
  "/dashboard/departments": "DIRECTOR",

  // Approvals - require COORDINATOR or higher (to view, actual approval needs MANAGER+)
  "/dashboard/approvals": "COORDINATOR",

  // Strategy period management - require ADMIN
  "/strategy-period": "ADMIN",

  // These are accessible by all authenticated users
  "/dashboard": "NORMAL",
  "/dashboard/objectives": "NORMAL",
  "/dashboard/reports": "NORMAL",
  "/dashboard/settings": "NORMAL",
};

/**
 * Check if a role has at least the minimum required level
 */
function hasMinimumRole(
  userRole: string | undefined,
  minimumRole: string
): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 999;
  return userLevel >= requiredLevel;
}

/**
 * Get the minimum role required for a route
 */
function getRouteMinimumRole(pathname: string): string | null {
  // Check for exact match first
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }

  // Check for prefix matches (for nested routes)
  // Sort by length descending to match most specific route first
  const sortedRoutes = Object.keys(ROUTE_PERMISSIONS).sort(
    (a, b) => b.length - a.length
  );

  for (const route of sortedRoutes) {
    if (pathname.startsWith(route + "/") || pathname === route) {
      return ROUTE_PERMISSIONS[route];
    }
  }

  return null;
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

  // Define protected routes (routes that require authentication)
  const protectedRoutes = ["/dashboard", "/strategy-period"];

  // Define public routes (routes that don't require authentication)
  const publicRoutes = ["/auth", "/"];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
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
    const minimumRole = getRouteMinimumRole(pathname);

    if (minimumRole && !hasMinimumRole(userRole, minimumRole)) {
      // User doesn't have permission - redirect to dashboard with error
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("access_denied", "true");
      dashboardUrl.searchParams.set("required_role", minimumRole);
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
