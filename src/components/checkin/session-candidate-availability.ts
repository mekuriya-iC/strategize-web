interface SessionCandidateEmployee {
  employeeId?: string | null;
}

interface SessionCandidatePeriod {
  strategicPeriodId?: string | null;
}

export interface ExistingCheckinoutSession {
  overallStatus?: string | null;
  weekStartDate?: string | null;
  weekEndDate?: string | null;
  employee?: SessionCandidateEmployee | null;
  strategicPeriod?: SessionCandidatePeriod | null;
}

export function getEmployeesWithOverlappingOpenSessions(
  sessions: readonly ExistingCheckinoutSession[],
  strategicPeriodId: string,
  weekStartDate: string,
  weekEndDate: string,
): Set<string> {
  const unavailable = new Set<string>();
  if (!strategicPeriodId || !weekStartDate || !weekEndDate) return unavailable;

  for (const session of sessions) {
    const employeeId = session.employee?.employeeId;
    if (
      !employeeId ||
      String(session.overallStatus || "").toUpperCase() !== "OPEN" ||
      session.strategicPeriod?.strategicPeriodId !== strategicPeriodId ||
      !session.weekStartDate ||
      !session.weekEndDate
    ) {
      continue;
    }

    const overlaps =
      session.weekStartDate <= weekEndDate &&
      session.weekEndDate >= weekStartDate;
    if (overlaps) unavailable.add(employeeId);
  }

  return unavailable;
}

export function sortSessionCandidates<
  Candidate extends { role?: string | null; fullName?: string | null },
>(candidates: readonly Candidate[]): Candidate[] {
  return [...candidates].sort((left, right) => {
    const leftRank = left.role === "DIRECTOR" ? 0 : 1;
    const rightRank = right.role === "DIRECTOR" ? 0 : 1;
    return (
      leftRank - rightRank ||
      String(left.fullName || "").localeCompare(String(right.fullName || ""))
    );
  });
}
