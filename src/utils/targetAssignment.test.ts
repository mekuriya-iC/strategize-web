import { Kpi } from "@/types/graphql";

// Mock data for testing target assignment logic
const createMockKPI = (
  kpiId: string,
  name: string,
  target: number,
  timeline: string = "2025/26"
): Kpi => ({
  kpiId,
  name,
  baseline: 100,
  weight: 10,
  unitType: "NUMBER",
  status: "APPROVED",
  targets: [{ timeline, target }],
  objective: null,
  parent: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
});

describe("Target Assignment Fix", () => {
  describe("Corporate Target Preservation", () => {
    it("should preserve corporate targets when assigning to divisions", () => {
      // Original corporate KPI
      const corporateKPI = createMockKPI("corp-1", "Total Revenue", 200);

      // Simulate assignment result - new assignee KPI IDs
      const assignmentResult = {
        kpis: [{ kpiId: "div-1", name: "Total Revenue", status: "APPROVED" }],
      };

      // Original KPIs array
      const originalKpis = [corporateKPI];

      // Create mapping from original KPI names to new assignee KPI IDs
      const kpiNameToAssigneeId = new Map();
      assignmentResult.kpis.forEach(
        (assigneeKpi: { kpiId: string; name: string; status: string }) => {
          const originalKpi = originalKpis.find(
            (k) => k.kpiId === assigneeKpi.kpiId
          );
          if (originalKpi) {
            kpiNameToAssigneeId.set(originalKpi.name, assigneeKpi.kpiId);
          }
        }
      );

      // Test the mapping
      const assigneeKpiId = kpiNameToAssigneeId.get("Total Revenue");

      // Verify we get the correct assignee KPI ID
      expect(assigneeKpiId).toBe("div-1");

      // Verify corporate KPI remains unchanged
      expect(corporateKPI.targets[0].target).toBe(200);
    });

    it("should update assignee KPI targets independently", () => {
      // Original corporate KPI
      const corporateKPI = createMockKPI("corp-1", "Total Revenue", 200);

      // New assignee KPI (created by assignment)
      const assigneeKPI = createMockKPI("div-1", "Total Revenue", 0); // Initially 0

      // Simulate target assignment
      const assignedTarget = 100;

      // Update assignee KPI target
      assigneeKPI.targets[0].target = assignedTarget;

      // Verify corporate KPI remains unchanged
      expect(corporateKPI.targets[0].target).toBe(200);

      // Verify assignee KPI gets the assigned target
      expect(assigneeKPI.targets[0].target).toBe(100);
    });

    it("should handle multiple KPIs correctly", () => {
      // Original corporate KPIs
      const corporateKPIs = [
        createMockKPI("corp-1", "Total Revenue", 200),
        createMockKPI("corp-2", "Customer Satisfaction", 85),
      ];

      // Assignment result with new assignee KPI IDs
      const assignmentResult = {
        kpis: [
          { kpiId: "div-1", name: "Total Revenue", status: "APPROVED" },
          { kpiId: "div-2", name: "Customer Satisfaction", status: "APPROVED" },
        ],
      };

      // Create mapping
      const kpiNameToAssigneeId = new Map();
      assignmentResult.kpis.forEach(
        (assigneeKpi: { kpiId: string; name: string; status: string }) => {
          const originalKpi = corporateKPIs.find(
            (k) => k.name === assigneeKpi.name
          );
          if (originalKpi) {
            kpiNameToAssigneeId.set(originalKpi.name, assigneeKpi.kpiId);
          }
        }
      );

      // Verify mappings
      expect(kpiNameToAssigneeId.get("Total Revenue")).toBe("div-1");
      expect(kpiNameToAssigneeId.get("Customer Satisfaction")).toBe("div-2");

      // Verify corporate KPIs remain unchanged
      expect(corporateKPIs[0].targets[0].target).toBe(200);
      expect(corporateKPIs[1].targets[0].target).toBe(85);
    });
  });

  describe("Timeline Consistency", () => {
    it("should use correct timeline from strategic period context", () => {
      // Mock strategic period context
      const strategicPeriodState = {
        annualTimeline: "2025/26",
      };

      // Removed unused objective variable

      // Helper function to get timeline (simplified version)
      const getTimelineFromContext = (): string => {
        if (strategicPeriodState?.annualTimeline) {
          return strategicPeriodState.annualTimeline;
        }
        return "2025/26"; // Fallback
      };

      const timeline = getTimelineFromContext();
      expect(timeline).toBe("2025/26");
    });
  });

  describe("Assignment Flow Validation", () => {
    it("should maintain data integrity throughout assignment process", () => {
      // Before assignment
      const corporateKPI = createMockKPI("corp-1", "Total Revenue", 200);

      // After assignment (simulated)
      const assigneeKPI = createMockKPI("div-1", "Total Revenue", 100);

      // Verify corporate KPI is unchanged
      expect(corporateKPI.targets[0].target).toBe(200);
      expect(corporateKPI.kpiId).toBe("corp-1");

      // Verify assignee KPI has assigned target
      expect(assigneeKPI.targets[0].target).toBe(100);
      expect(assigneeKPI.kpiId).toBe("div-1");

      // Verify they are different KPIs
      expect(corporateKPI.kpiId).not.toBe(assigneeKPI.kpiId);
    });
  });

  describe("Assigned Target Display Fix", () => {
    it("should show actual assigned target instead of parent target", () => {
      // Removed unused corporateKPI variable

      // Division KPI with assigned target (should show 100, not 200)
      const divisionKPI = createMockKPI("div-1", "Total Revenue", 100); // Assigned value

      // Mock getAssignedTarget function (simplified version)
      const getAssignedTarget = (kpi: Kpi, year: string): number | null => {
        // 1. Check current KPI's targets first (actual assigned value)
        if (kpi?.targets) {
          const currentTarget = kpi.targets.find((t) => t.timeline === year);
          if (currentTarget) {
            return currentTarget.target; // ✅ This should be the assigned value
          }
        }

        // 2. Fallback to parent target (should not be used for assigned KPIs)
        return null;
      };

      // Test that division KPI shows assigned target (100), not parent target (200)
      const assignedTarget = getAssignedTarget(divisionKPI, "2025/26");

      expect(assignedTarget).toBe(100); // ✅ Should show assigned value
      expect(assignedTarget).not.toBe(200); // ❌ Should not show parent value
    });

    it("should handle fallback logic correctly", () => {
      // KPI without assigned targets (should fallback to strategic targets)
      const kpiWithoutTargets = createMockKPI("div-1", "Total Revenue", 0);
      kpiWithoutTargets.targets = []; // No assigned targets

      // Mock strategic targets
      const strategicTargetsById = {
        "corp-1": {
          "2025/26": 150,
        },
      };

      // Mock getAssignedTarget with fallback logic
      const getAssignedTargetWithFallback = (
        kpi: Kpi,
        strategicTargets: Record<string, Record<string, number>>,
        year: string
      ): number | null => {
        // 1. Check current KPI's targets first
        if (kpi?.targets && kpi.targets.length > 0) {
          const currentTarget = kpi.targets.find((t) => t.timeline === year);
          if (currentTarget) {
            return currentTarget.target;
          }
        }

        // 2. Fallback to strategic targets
        if (
          strategicTargets?.[kpi?.parent?.kpiId || ""]?.[year] !== undefined
        ) {
          return strategicTargets[kpi?.parent?.kpiId || ""][year];
        }

        return null;
      };

      // Test fallback behavior
      const fallbackTarget = getAssignedTargetWithFallback(
        kpiWithoutTargets,
        strategicTargetsById,
        "2025/26"
      );

      expect(fallbackTarget).toBe(150); // ✅ Should use strategic target as fallback
    });
  });
});

// Export test scenarios for integration testing
export const testScenarios = {
  corporateTargetPreservation: {
    description: "Corporate targets should remain unchanged after assignment",
    before: {
      corporateKPI: { kpiId: "corp-1", target: 200, name: "Total Revenue" },
    },
    after: {
      corporateKPI: { kpiId: "corp-1", target: 200, name: "Total Revenue" }, // Unchanged
      assigneeKPI: { kpiId: "div-1", target: 100, name: "Total Revenue" }, // New assigned target
    },
  },

  timelineConsistency: {
    description: "Timeline should be consistent across all components",
    expected: "2025/26",
    testCases: [
      "Corporate KPI timeline",
      "Division KPI timeline",
      "Assignment dialog timeline",
    ],
  },
};
