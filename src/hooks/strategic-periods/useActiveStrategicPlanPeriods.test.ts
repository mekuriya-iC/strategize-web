import { describe, expect, it } from "vitest";
import { selectLatestActiveStrategicPlan } from "./useActiveStrategicPlanPeriods";

const plan = (
  strategicPlanId: string,
  organizationId: string,
  createdAt: string,
  overrides: Partial<{
    isActive: boolean;
    archivedAt: string | null;
  }> = {},
) => ({
  strategicPlanId,
  organization: { organizationId },
  createdAt,
  isActive: true,
  archivedAt: null,
  ...overrides,
});

describe("selectLatestActiveStrategicPlan", () => {
  it("selects only the newest active, non-archived plan for the current organization", () => {
    const selected = selectLatestActiveStrategicPlan(
      [
        plan("other-org", "org-2", "2026-04-01T00:00:00.000Z"),
        plan("inactive", "org-1", "2026-03-01T00:00:00.000Z", {
          isActive: false,
        }),
        plan("archived", "org-1", "2026-02-01T00:00:00.000Z", {
          archivedAt: "2026-05-01T00:00:00.000Z",
        }),
        plan("older-active", "org-1", "2025-01-01T00:00:00.000Z"),
        plan("latest-active", "org-1", "2026-01-01T00:00:00.000Z"),
      ],
      "org-1",
    );

    expect(selected?.strategicPlanId).toBe("latest-active");
  });

  it("uses the plan ID as a deterministic tie-breaker", () => {
    const selected = selectLatestActiveStrategicPlan(
      [
        plan("plan-a", "org-1", "2026-01-01T00:00:00.000Z"),
        plan("plan-b", "org-1", "2026-01-01T00:00:00.000Z"),
      ],
      "org-1",
    );

    expect(selected?.strategicPlanId).toBe("plan-b");
  });

  it("does not select a plan before organization context exists", () => {
    expect(
      selectLatestActiveStrategicPlan(
        [plan("plan-a", "org-1", "2026-01-01T00:00:00.000Z")],
        undefined,
      ),
    ).toBeUndefined();
  });
});
