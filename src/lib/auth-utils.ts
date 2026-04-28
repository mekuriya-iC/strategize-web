/**
 * Authentication Utilities
 * Handles JWT token management, expiration checking, and refresh logic
 */

import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { authLogger } from "@/lib/logger";

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Cookie configuration
export const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

// Token will be considered "expiring soon" if less than this many minutes remain
const TOKEN_EXPIRY_THRESHOLD_MINUTES = 30;

/**
 * Get the current access token from cookies
 */
export function getAccessToken(): string | undefined {
  return Cookies.get("accessToken");
}

/**
 * Set the access token in cookies
 */
export function setAccessToken(token: string): void {
  Cookies.set("accessToken", token, COOKIE_OPTIONS);
}

/**
 * Remove the access token from cookies
 */
export function removeAccessToken(): void {
  Cookies.remove("accessToken", { path: "/" });
}

/**
 * Decode a JWT token and return its payload
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    authLogger.error("Failed to decode JWT token:", error);
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;

  const now = Date.now() / 1000; // Current time in seconds
  return payload.exp < now;
}

/**
 * Check if a token is about to expire (within threshold)
 */
export function isTokenExpiringSoon(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;

  const now = Date.now() / 1000;
  const expiresIn = payload.exp - now;
  const thresholdSeconds = TOKEN_EXPIRY_THRESHOLD_MINUTES * 60;

  return expiresIn < thresholdSeconds;
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenExpiryTime(token: string): number | null {
  const payload = decodeToken(token);
  if (!payload) return null;

  const now = Date.now() / 1000;
  return Math.max(0, payload.exp - now);
}

/**
 * Get a human-readable expiry time
 */
export function getTokenExpiryDisplay(token: string): string {
  const seconds = getTokenExpiryTime(token);
  if (seconds === null) return "Unknown";

  if (seconds <= 0) return "Expired";

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  return `${Math.floor(seconds)} seconds`;
}

/**
 * Handle session expiration - clears token and redirects to login
 */
export function handleSessionExpired(message?: string): void {
  // Check if this is an intentional logout (don't show expired message)
  if (typeof window !== "undefined") {
    const intentionalLogout = sessionStorage.getItem("intentionalLogout");
    if (intentionalLogout) {
      // User is logging out intentionally, don't show expired message
      return;
    }
  }

  removeAccessToken();

  // Store message to show on login page
  if (message) {
    sessionStorage.setItem("authMessage", message);
  }

  // Redirect to login
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    if (currentPath !== "/auth") {
      window.location.href = `/auth?redirect=${encodeURIComponent(
        currentPath
      )}&expired=true`;
    }
  }
}

/**
 * Check token validity and handle expiration
 * Returns true if token is valid, false if expired/invalid
 */
export function validateToken(): boolean {
  const token = getAccessToken();

  if (!token) {
    authLogger.debug("No access token found");
    return false;
  }

  if (isTokenExpired(token)) {
    authLogger.warn("Access token has expired");
    handleSessionExpired("Your session has expired. Please log in again.");
    return false;
  }

  // Log warning if token is expiring soon
  if (isTokenExpiringSoon(token)) {
    const expiryDisplay = getTokenExpiryDisplay(token);
    authLogger.warn(`Token expiring soon (${expiryDisplay} remaining)`);
    // TODO: When backend supports refresh, trigger refresh here
  }

  return true;
}

/**
 * Token refresh with backend support
 * Attempts to refresh the access token using the backend refresh endpoint
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    // Import dynamically to avoid circular dependencies
    const { ApolloClient, InMemoryCache, HttpLink, gql } = await import('@apollo/client');
    
    const REFRESH_TOKEN_MUTATION = gql`
      mutation RefreshToken {
        refreshToken {
          accessToken
        }
      }
    `;

    // Create a temporary Apollo client for the refresh request
    const client = new ApolloClient({
      link: new HttpLink({
        uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3000/graphql',
        credentials: 'include', // Include cookies for refresh token
      }),
      cache: new InMemoryCache(),
    });

    const { data } = await client.mutate({
      mutation: REFRESH_TOKEN_MUTATION,
    });

    if (data?.refreshToken?.accessToken) {
      const newToken = data.refreshToken.accessToken;
      setAccessToken(newToken);
      authLogger.info("Token refreshed successfully");
      return newToken;
    }

    authLogger.warn("No access token in refresh response");
    return null;
  } catch (error) {
    authLogger.error("Failed to refresh token:", error);
    
    // If refresh fails, handle session expiration
    handleSessionExpired("Your session has expired. Please log in again.");
    return null;
  }
}


/**
 * Setup automatic token expiration checking
 * Call this once when the app initializes
 */
export function setupTokenExpirationChecker(
  onExpired?: () => void
): () => void {
  const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

  const intervalId = setInterval(() => {
    const token = getAccessToken();
    if (!token) return;

    if (isTokenExpired(token)) {
      authLogger.warn("Token expired during session");
      handleSessionExpired("Your session has expired. Please log in again.");
      onExpired?.();
      clearInterval(intervalId);
    } else if (isTokenExpiringSoon(token)) {
      // Try to refresh token if supported
      refreshAccessToken().then((newToken) => {
        if (!newToken) {
          authLogger.warn("Could not refresh token - will expire soon");
        }
      });
    }
  }, CHECK_INTERVAL_MS);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

