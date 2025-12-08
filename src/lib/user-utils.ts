/**
 * User-related utility functions
 */

/**
 * Get initials from a full name or email
 * @param fullName - The full name of the user
 * @param email - The email of the user (fallback)
 * @returns Initials (1-2 characters, uppercase)
 */
export function getInitials(
  fullName?: string | null,
  email?: string | null
): string {
  if (fullName) {
    const parts = fullName.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName[0]?.toUpperCase() || "U";
  }
  return email?.[0]?.toUpperCase() || "U";
}

/**
 * Format a full name for display
 * @param fullName - The full name
 * @returns Formatted name or "Unknown"
 */
export function formatDisplayName(fullName?: string | null): string {
  if (!fullName) return "Unknown";
  return fullName.trim();
}

/**
 * Get first name from full name
 * @param fullName - The full name
 * @returns First name or the full name if no space found
 */
export function getFirstName(fullName?: string | null): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  return parts[0] || "";
}

/**
 * Get last name from full name
 * @param fullName - The full name
 * @returns Last name or empty string if not found
 */
export function getLastName(fullName?: string | null): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}
