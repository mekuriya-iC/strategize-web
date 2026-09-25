/** Match the personal (non-management) objectives view, including HR. */
export function usesPersonalObjectiveScope(role?: string | null): boolean {
  return !["SUPER_ADMIN", "ADMIN", "DIRECTOR", "MANAGER", "COORDINATOR"].includes(
    role || "",
  );
}

export function isPersonalObjectiveAssignment(
  objective: { assigneeType?: string | null; assigneeId?: string | null },
  employeeId?: string | null,
): boolean {
  // Parent objectives provide context through the separate lookup only. They
  // are not employee assignments and must not enter personal rows or weights.
  return (
    Boolean(employeeId) &&
    objective.assigneeType === "PERSONNEL" &&
    objective.assigneeId === employeeId
  );
}
