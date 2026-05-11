/**
 * Organization Constants
 *
 * getOrganizationId() is kept for legacy call sites but should be replaced
 * with useAuthStore((s) => s.user?.organizationId) in React components.
 */
export const DEFAULT_ORGANIZATION_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '';

export function getOrganizationId(): string {
  // Try to get from auth store (works outside React components too via getState)
  try {
    const { useAuthStore } = require('@/stores/authStore');
    const orgId = useAuthStore.getState().user?.organizationId;
    if (orgId) return orgId;
  } catch {
    // ignore — store not available in SSR context
  }
  return DEFAULT_ORGANIZATION_ID;
}
