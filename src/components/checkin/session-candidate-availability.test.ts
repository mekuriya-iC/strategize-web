import { describe, expect, it } from "vitest";
import {
  getEmployeesWithOverlappingOpenSessions,
  sortSessionCandidates,
} from "./session-candidate-availability";

describe("check-in session candidate availability", () => {
  it("does not hide a director because of an open session from a different week", () => {
    const unavailable = getEmployeesWithOverlappingOpenSessions(
      [
        {
          overallStatus: "OPEN",
          weekStartDate: "2026-08-17",
          weekEndDate: "2026-08-23",
          employee: { employeeId: "director-1" },
          strategicPeriod: { strategicPeriodId: "period-1" },
        },
      ],
      "period-1",
      "2026-08-24",
      "2026-08-30",
    );

    expect(unavailable.has("director-1")).toBe(false);
  });

  it("hides a candidate only for an overlapping open session in the selected period", () => {
    const unavailable = getEmployeesWithOverlappingOpenSessions(
      [
        {
          overallStatus: "OPEN",
          weekStartDate: "2026-08-24",
          weekEndDate: "2026-08-30",
          employee: { employeeId: "director-1" },
          strategicPeriod: { strategicPeriodId: "period-1" },
        },
        {
          overallStatus: "COMPLETED",
          weekStartDate: "2026-08-24",
          weekEndDate: "2026-08-30",
          employee: { employeeId: "manager-1" },
          strategicPeriod: { strategicPeriodId: "period-1" },
        },
      ],
      "period-1",
      "2026-08-24",
      "2026-08-30",
    );

    expect([...unavailable]).toEqual(["director-1"]);
  });

  it("orders directors before managers", () => {
    expect(
      sortSessionCandidates([
        { fullName: "Manager One", role: "MANAGER" },
        { fullName: "Director One", role: "DIRECTOR" },
      ]).map((candidate) => candidate.role),
    ).toEqual(["DIRECTOR", "MANAGER"]);
  });
});
