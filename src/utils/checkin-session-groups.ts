export type CheckinoutSessionLike = {
  checkinoutSessionId: string;
  title?: string | null;
  weekStartDate: string;
  weekEndDate: string;
  overallStatus?: string | null;
  isLocked?: boolean | null;
  employee?: {
    employeeId?: string | null;
    fullName?: string | null;
    role?: string | null;
  } | null;
  supervisor?: {
    employeeId?: string | null;
    fullName?: string | null;
  } | null;
  strategicPeriod?: {
    strategicPeriodId?: string | null;
    name?: string | null;
  } | null;
};

export type CheckinoutSessionWeekGroup<T extends CheckinoutSessionLike> = {
  key: string;
  representativeSession: T;
  participantSessions: T[];
};

export const getLeadershipCheckinoutSessions = <
  T extends CheckinoutSessionLike,
>(sessions: T[]): T[] => {
  const sessionsById = new Map<string, T>();
  for (const session of sessions) {
    if (
      session?.checkinoutSessionId &&
      ["MANAGER", "DIRECTOR"].includes(
        String(session.employee?.role || "").toUpperCase(),
      )
    ) {
      sessionsById.set(session.checkinoutSessionId, session);
    }
  }
  return Array.from(sessionsById.values());
};

export const getCheckinoutSessionWeekKey = (
  session: CheckinoutSessionLike,
): string =>
  [
    session.supervisor?.employeeId ?? "",
    session.strategicPeriod?.strategicPeriodId ?? "",
    session.weekStartDate,
    session.weekEndDate,
  ].join("|");

export const groupCheckinoutSessionsByWeek = <
  T extends CheckinoutSessionLike,
>(
  sessions: T[],
): CheckinoutSessionWeekGroup<T>[] => {
  const groups = new Map<string, CheckinoutSessionWeekGroup<T>>();

  for (const session of sessions) {
    if (!session?.checkinoutSessionId) continue;

    const key = getCheckinoutSessionWeekKey(session);
    const existing = groups.get(key);
    if (existing) {
      if (
        !existing.participantSessions.some(
          (participant) =>
            participant.checkinoutSessionId === session.checkinoutSessionId,
        )
      ) {
        existing.participantSessions.push(session);
      }
      continue;
    }

    groups.set(key, {
      key,
      representativeSession: session,
      participantSessions: [session],
    });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    participantSessions: [...group.participantSessions].sort((a, b) =>
      (a.employee?.fullName ?? "").localeCompare(b.employee?.fullName ?? ""),
    ),
  }));
};
