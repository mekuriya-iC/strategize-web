import { describe, expect, it } from "vitest";
import type { CheckinoutSessionLike } from "./checkin-session-groups";
import {
  deduplicateCheckinoutSessions,
  isExpiredCheckinoutSession,
  isHistoricalCheckinoutSession,
} from "./checkin-session-history";

const session = (
  overrides: Partial<CheckinoutSessionLike> = {},
): CheckinoutSessionLike => ({
  checkinoutSessionId: "session-1",
  weekStartDate: "2026-08-17",
  weekEndDate: "2026-08-23",
  overallStatus: "OPEN",
  ...overrides,
});

describe("check-in/out session history", () => {
  it("treats weekEndDate as inclusive", () => {
    expect(
      isExpiredCheckinoutSession(session(), new Date(2026, 7, 23, 23, 59)),
    ).toBe(false);
    expect(
      isExpiredCheckinoutSession(session(), new Date(2026, 7, 24, 0, 0)),
    ).toBe(true);
  });

  it("classifies CLOSED sessions as history even before their end date", () => {
    expect(
      isHistoricalCheckinoutSession(
        session({ overallStatus: "CLOSED" }),
        new Date(2026, 7, 20),
      ),
    ).toBe(true);
  });

  it("uses expiration as a reconciliation fallback for non-closed sessions", () => {
    expect(isHistoricalCheckinoutSession(session(), new Date(2026, 7, 24))).toBe(
      true,
    );
    expect(isHistoricalCheckinoutSession(session(), new Date(2026, 7, 23))).toBe(
      false,
    );
  });

  it("deduplicates sessions aggregated from overlapping scopes", () => {
    const duplicate = session();
    const distinct = session({ checkinoutSessionId: "session-2" });

    expect(
      deduplicateCheckinoutSessions([duplicate, distinct, duplicate]).map(
        ({ checkinoutSessionId }) => checkinoutSessionId,
      ),
    ).toEqual(["session-1", "session-2"]);
  });
});
