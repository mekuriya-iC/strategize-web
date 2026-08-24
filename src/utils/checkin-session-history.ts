import type { CheckinoutSessionLike } from "./checkin-session-groups";

const calendarDateValue = (value: string | Date): number | null => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.getTime();
};

export const isClosedCheckinoutSession = (
  session: Pick<CheckinoutSessionLike, "overallStatus">,
): boolean => session.overallStatus?.toUpperCase() === "CLOSED";

export const isExpiredCheckinoutSession = (
  session: Pick<CheckinoutSessionLike, "weekEndDate">,
  today: Date = new Date(),
): boolean => {
  const endDate = calendarDateValue(session.weekEndDate);
  const todayDate = calendarDateValue(today);
  return endDate !== null && todayDate !== null && todayDate > endDate;
};

export const isHistoricalCheckinoutSession = (
  session: Pick<CheckinoutSessionLike, "overallStatus" | "weekEndDate">,
  today: Date = new Date(),
): boolean =>
  isClosedCheckinoutSession(session) ||
  isExpiredCheckinoutSession(session, today);

export const deduplicateCheckinoutSessions = <T extends CheckinoutSessionLike>(
  sessions: T[],
): T[] => {
  const sessionsById = new Map<string, T>();
  for (const session of sessions) {
    if (session?.checkinoutSessionId) {
      sessionsById.set(session.checkinoutSessionId, session);
    }
  }
  return Array.from(sessionsById.values());
};
