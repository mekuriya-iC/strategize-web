import { useAuthStore } from "@/stores";

/**
 * Returns the current user's organizationId from the auth store.
 * Use this everywhere instead of getOrganizationId() or hardcoded UUIDs.
 */
export function useOrganizationId(): string {
  return useAuthStore((s) => s.user?.organizationId ?? "");
}
