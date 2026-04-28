import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/email-sent',
  '/auth/reset-success',
];

// Routes that require specific roles
const ROLE_BASED_ROUTES: Record<string, string[]> = {
  '/dashboard/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/dashboard/approvals': ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'DIRECTOR'],
  '/organization-template': ['ADMIN', 'SUPER_ADMIN'],
  '/org-structure': ['ADMIN', 'SUPER_ADMIN'],
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = jwtDecode<JWTPayload>(token);
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch {
    return true;
  }
}

function hasRequiredRole(pathname: string, userRole: string): boolean {
  // Check if route requires specific roles
  for (const [route, allowedRoles] of Object.entries(ROLE_BASED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(userRole);
    }
  }
  // If no specific role requirement, allow access
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for access token
  const accessToken = request.cookies.get('accessToken')?.value;

  if (!accessToken) {
    // No token, redirect to login with return URL
    const url = new URL('/auth', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Validate token
  if (isTokenExpired(accessToken)) {
    // Token expired, redirect to login
    const url = new URL('/auth', request.url);
    url.searchParams.set('expired', 'true');
    url.searchParams.set('redirect', pathname);
    
    // Clear the expired token
    const response = NextResponse.redirect(url);
    response.cookies.delete('accessToken');
    return response;
  }

  // Check role-based access
  try {
    const payload = jwtDecode<JWTPayload>(accessToken);
    const userRole = payload.role;

    if (!hasRequiredRole(pathname, userRole)) {
      // User doesn't have required role, redirect to dashboard
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // Invalid token, redirect to login
    const url = new URL('/auth', request.url);
    const response = NextResponse.redirect(url);
    response.cookies.delete('accessToken');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
