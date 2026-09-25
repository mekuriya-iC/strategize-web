import { describe, expect, it } from "vitest";
import {
  getCheckinoutSessionWeekKey,
  getLeadershipCheckinoutSessions,
  getSuperAdminCheckinoutSessions,
  groupCheckinoutSessionsByWeek,
  type CheckinoutSessionLike,
} from "./checkin-session-groups";

const session = (
  overrides: Partial<CheckinoutSessionLike> & {
    checkinoutSessionId: string;
  },
): CheckinoutSessionLike => ({
  weekStartDate: "2026-08-10",
  weekEndDate: "2026-08-16",
  supervisor: { employeeId: "manager-1", fullName: "Manager" },
  strategicPeriod: { strategicPeriodId: "period-1", name: "2026/27" },
  employee: { employeeId: "employee-1", fullName: "Employee" },
  ...overrides,
});

describe("check-in/out session week grouping", () => {
  it("returns every session for super-admin, including manager/director team sessions", () => {
    const rows = [
      session({ checkinoutSessionId: "corporate", supervisor: { employeeId: "admin-2", role: "SUPER_ADMIN" } }),
      session({ checkinoutSessionId: "staff", supervisor: { employeeId: "director", role: "DIRECTOR" }, overallStatus: "CLOSED" }),
      session({ checkinoutSessionId: "manager-under-director", employee: { employeeId: "manager", role: "MANAGER" }, supervisor: { employeeId: "director", role: "DIRECTOR" } }),
      session({ checkinoutSessionId: "own", employee: { employeeId: "admin-1" } }),
      session({ checkinoutSessionId: "cached-own-team", supervisor: { employeeId: "admin-1" } }),
      session({ checkinoutSessionId: "unresolved-supervisor", supervisor: null }),
    ];
    expect(getSuperAdminCheckinoutSessions(rows, "admin-1").map((row) => row.checkinoutSessionId))
      .toEqual([
        "corporate",
        "staff",
        "manager-under-director",
        "own",
        "cached-own-team",
        "unresolved-supervisor",
      ]);
    expect(getSuperAdminCheckinoutSessions(rows, undefined).map((row) => row.checkinoutSessionId))
      .toEqual(rows.map((row) => row.checkinoutSessionId));
  });
  it("groups participant sessions for the same manager, period, and week", () => {
    const groups = groupCheckinoutSessionsByWeek([
      session({
        checkinoutSessionId: "session-2",
        employee: { employeeId: "employee-2", fullName: "Beta Person" },
      }),
      session({
        checkinoutSessionId: "session-1",
        employee: { employeeId: "employee-1", fullName: "Alpha Person" },
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(
      groups[0].participantSessions.map(
        (participant) => participant.employee?.fullName,
      ),
    ).toEqual(["Alpha Person", "Beta Person"]);
  });

  it("deduplicates Super Admin leadership sessions and excludes non-leaders", () => {
    const director = session({
      checkinoutSessionId: "director-session",
      employee: {
        employeeId: "director-1",
        fullName: "Director",
        role: "DIRECTOR",
      },
    });

    expect(
      getLeadershipCheckinoutSessions([
        director,
        { ...director },
        session({
          checkinoutSessionId: "employee-session",
          employee: {
            employeeId: "employee-1",
            fullName: "Employee",
            role: "EMPLOYEE",
          },
        }),
      ]).map((item) => item.checkinoutSessionId),
    ).toEqual(["director-session"]);
  });

  it("keeps different weeks in separate cards", () => {
    const groups = groupCheckinoutSessionsByWeek([
      session({ checkinoutSessionId: "week-1" }),
      session({
        checkinoutSessionId: "week-2",
        weekStartDate: "2026-08-17",
        weekEndDate: "2026-08-23",
      }),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("does not combine sessions from different supervisors or periods", () => {
    const base = session({ checkinoutSessionId: "base" });
    const otherSupervisor = session({
      checkinoutSessionId: "other-supervisor",
      supervisor: { employeeId: "manager-2", fullName: "Other Manager" },
    });
    const otherPeriod = session({
      checkinoutSessionId: "other-period",
      strategicPeriod: { strategicPeriodId: "period-2", name: "2027/28" },
    });

    expect(
      new Set(
        [base, otherSupervisor, otherPeriod].map(getCheckinoutSessionWeekKey),
      ).size,
    ).toBe(3);
  });
});
