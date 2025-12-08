/**
 * Environment Configuration
 *
 * This file centralizes all environment variables used in the application.
 * It provides type-safe access and default values for configuration.
 *
 * To configure:
 * 1. Create a .env.local file in the project root
 * 2. Add the required environment variables
 * 3. Restart the development server
 */

// API Configuration
export const API_CONFIG = {
  /**
   * Base URL for the API
   * @default "https://strategize-api.frontiertech.org"
   */
  baseUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://strategize-api.frontiertech.org",

  /**
   * GraphQL endpoint path (proxied through Next.js)
   * @default "/api/graphql"
   */
  graphqlEndpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "/api/graphql",
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  /**
   * Cookie name for storing access token
   * @default "accessToken"
   */
  cookieName: process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "accessToken",

  /**
   * Token refresh threshold in seconds (refresh this many seconds before expiry)
   * @default 300 (5 minutes)
   */
  refreshThreshold: parseInt(
    process.env.NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD || "300",
    10
  ),

  /**
   * Cookie expiration in days
   * @default 7
   */
  cookieExpirationDays: 7,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  /**
   * Enable debug logging
   * @default false in production, true in development
   */
  enableDebugLogging:
    process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGGING === "true" ||
    process.env.NODE_ENV === "development",

  /**
   * Enable analytics dashboard
   * @default true
   */
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "false",
} as const;

// Application Settings
export const APP_CONFIG = {
  /**
   * Default pagination page size
   * @default 10
   */
  defaultPageSize: parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE || "10",
    10
  ),

  /**
   * Maximum file upload size in bytes
   * @default 5MB
   */
  maxUploadSize:
    parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || "5", 10) *
    1024 *
    1024,

  /**
   * Allowed image domains for Next.js Image component
   */
  imageDomains: ["storage.googleapis.com", "strategize-api.frontiertech.org"],
} as const;

// Environment Checks
export const ENV = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;

