/**
 * Organization Constants
 * 
 * This file manages the default organization ID for the application.
 * In a multi-tenant system, this would come from user context or authentication.
 * For now, we use a default UUID that should be configured per deployment.
 */

// Default organization ID - should be set via environment variable in production
// This is a valid UUID format that the backend expects
export const DEFAULT_ORGANIZATION_ID = 
  process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 
  '00000000-0000-0000-0000-000000000001';

/**
 * Get the current organization ID
 * In the future, this could be enhanced to:
 * - Get from user context/auth
 * - Support multi-tenant scenarios
 * - Cache organization data
 */
export function getOrganizationId(): string {
  // TODO: In a multi-tenant system, get this from user context
  return DEFAULT_ORGANIZATION_ID;
}
