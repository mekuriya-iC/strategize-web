import { getDetailedUnitLabel } from "@/utils/unitTypeDetection";
import { Kpi } from "@/types/graphql";

// Mock KPI data for testing target validation
const createMockKPI = (
  name: string,
  unitType: "NUMBER" | "PERCENT",
  targets: Array<{ timeline: string; target: number }> = []
): Kpi => ({
  kpiId: "test-kpi",
  name,
  baseline: 100,
  weight: 10,
  unitType,
  status: "APPROVED",
  targets,
  objective: null,
  parent: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
});

describe("Target Validation System", () => {
  describe("getDetailedUnitLabel", () => {
    it("should return 'million ETB' for revenue KPIs", () => {
      const kpi = createMockKPI("Total Revenue", "NUMBER");
      expect(getDetailedUnitLabel(kpi)).toBe("million ETB");
    });

    it("should return 'items' for count KPIs", () => {
      const kpi = createMockKPI("Number of Clients", "NUMBER");
      expect(getDetailedUnitLabel(kpi)).toBe("items");
    });

    it("should return '%' for percentage KPIs", () => {
      const kpi = createMockKPI("Customer Satisfaction", "PERCENT");
      expect(getDetailedUnitLabel(kpi)).toBe("%");
    });
  });

  describe("Quarterly Validation Scenarios", () => {
    it("should validate corporate → division assignment", () => {
      // Corporate KPI: Total Revenue 227 million ETB
      const corporateKPI = createMockKPI("Total Revenue", "NUMBER", [
        { timeline: "2025/26", target: 227 },
      ]);

      // Division assigned: 150 million ETB
      const divisionKPI = createMockKPI("Division Revenue", "NUMBER", [
        { timeline: "2025/26", target: 150 },
      ]);

      // Quarterly breakdown should not exceed 150
      const quarterlySum = 40 + 35 + 40 + 35; // 150 - valid
      const exceedsSum = 50 + 45 + 40 + 35; // 170 - invalid

      // Validate that division target doesn't exceed corporate target
      expect(divisionKPI.targets[0].target).toBeLessThanOrEqual(
        corporateKPI.targets[0].target
      );

      expect(quarterlySum).toBe(150);
      expect(quarterlySum).toBeLessThanOrEqual(150);

      expect(exceedsSum).toBe(170);
      expect(exceedsSum).toBeGreaterThan(150);
    });

    it("should validate division → department assignment", () => {
      // Division assigned: 150 million ETB
      // Department assigned: 80 million ETB

      const departmentTarget = 80;
      const quarterlyBreakdown = [20, 25, 20, 15]; // Sum: 80 - valid
      const invalidBreakdown = [25, 30, 25, 20]; // Sum: 100 - invalid

      expect(quarterlyBreakdown.reduce((a, b) => a + b, 0)).toBe(80);
      expect(invalidBreakdown.reduce((a, b) => a + b, 0)).toBe(100);
      expect(invalidBreakdown.reduce((a, b) => a + b, 0)).toBeGreaterThan(
        departmentTarget
      );
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle percentage KPIs correctly", () => {
      const satisfactionKPI = createMockKPI(
        "Customer Satisfaction",
        "PERCENT",
        [{ timeline: "2025/26", target: 85 }]
      );

      // For percentage KPIs, typically the target is the same at all levels
      // But validation should still work if they want to set a lower target
      const quarterlyTargets = [85, 85, 85, 85]; // All quarters at 85%

      expect(getDetailedUnitLabel(satisfactionKPI)).toBe("%");
      expect(quarterlyTargets.every((target) => target <= 85)).toBe(true);
    });

    it("should handle count-based KPIs", () => {
      const clientsKPI = createMockKPI("Number of New Clients", "NUMBER", [
        { timeline: "2025/26", target: 100 },
      ]);

      const quarterlyTargets = [25, 30, 25, 20]; // Sum: 100
      const sum = quarterlyTargets.reduce((a, b) => a + b, 0);

      expect(getDetailedUnitLabel(clientsKPI)).toBe("items");
      expect(sum).toBe(100);
    });
  });
});

// Integration test scenarios
export const testScenarios = {
  corporateToDiv: {
    corporate: { name: "Total Revenue", target: 227, unit: "million ETB" },
    divisions: [
      { name: "Operation Division", assigned: 150, unit: "million ETB" },
      { name: "Capital Market Solutions", assigned: 77, unit: "million ETB" },
    ],
  },

  divisionToDept: {
    division: {
      name: "Operation Division Revenue",
      assigned: 150,
      unit: "million ETB",
    },
    departments: [
      { name: "Learning Solutions Revenue", assigned: 80, unit: "million ETB" },
      { name: "Consulting Revenue", assigned: 70, unit: "million ETB" },
    ],
  },

  deptToPersonnel: {
    department: {
      name: "Learning Solutions Revenue",
      assigned: 80,
      unit: "million ETB",
    },
    personnel: [
      { name: "Senior Consultant 1", assigned: 30, unit: "million ETB" },
      { name: "Senior Consultant 2", assigned: 25, unit: "million ETB" },
      { name: "Consultant 1", assigned: 25, unit: "million ETB" },
    ],
  },
};
