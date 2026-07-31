import {
  getDetailedUnitLabel,
  getInferredUnitType,
  detectKPIType,
  cleanKpiName,
} from "@/utils/unitTypeDetection";
import { Kpi } from "@/types/graphql";

// Mock KPI data for testing
const createMockKPI = (
  name: string,
  unitType: "NUMBER" | "PERCENT" | "RATIO",
): Kpi => ({
  kpiId: "test-kpi",
  name,
  baseline: 100,
  weight: 10,
  unitType,
  status: "APPROVED",
  targets: [{ timeline: "2025/26", target: 200 }],
  objective: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
});

describe("Unit Type Detection", () => {
  describe("getDetailedUnitLabel", () => {
    it("should return '%' for PERCENT unit type", () => {
      const kpi = createMockKPI("Customer Satisfaction", "PERCENT");
      expect(getDetailedUnitLabel(kpi)).toBe("%");
    });

    it("should return 'million ETB' for financial KPIs", () => {
      const kpi = createMockKPI("Total Revenue", "NUMBER");
      expect(getDetailedUnitLabel(kpi)).toBe("million ETB");
    });

    it("should return 'items' for count KPIs", () => {
      const kpi = createMockKPI("Number of Clients", "NUMBER");
      expect(getDetailedUnitLabel(kpi)).toBe("items");
    });

    it("should default to 'million ETB' for unknown NUMBER KPIs", () => {
      const kpi = createMockKPI("Some Random KPI", "NUMBER");
      expect(getDetailedUnitLabel(kpi)).toBe("million ETB");
    });
  });

  describe("getInferredUnitType", () => {
    it("should return PERCENT for PERCENT unit type", () => {
      const kpi = createMockKPI("Customer Satisfaction", "PERCENT");
      expect(getInferredUnitType(kpi)).toBe("PERCENT");
    });

    it("should return NUMBER_MILLION for financial KPIs", () => {
      const kpi = createMockKPI("Total Revenue", "NUMBER");
      expect(getInferredUnitType(kpi)).toBe("NUMBER_MILLION");
    });

    it("should return NUMBER_COUNT for count KPIs", () => {
      const kpi = createMockKPI("Number of Clients", "NUMBER");
      expect(getInferredUnitType(kpi)).toBe("NUMBER_COUNT");
    });
  });

  describe("detectKPIType", () => {
    it("should return PERCENTAGE for PERCENT unit type", () => {
      const kpi = createMockKPI("Customer Satisfaction", "PERCENT");
      expect(detectKPIType(kpi)).toBe("PERCENTAGE");
    });

    it("should return PERCENTAGE for RATIO unit type", () => {
      const kpi = createMockKPI("Sales per representative", "RATIO");
      expect(detectKPIType(kpi)).toBe("PERCENTAGE");
    });

    it("should return SUMMABLE for NUMBER unit type", () => {
      const kpi = createMockKPI("Total Revenue", "NUMBER");
      expect(detectKPIType(kpi)).toBe("SUMMABLE");
    });
  });

  describe("cleanKpiName", () => {
    it("should remove [MILLION] prefix", () => {
      expect(cleanKpiName("[MILLION] Total Revenue")).toBe("Total Revenue");
    });

    it("should remove [COUNT] prefix", () => {
      expect(cleanKpiName("[COUNT] Number of Clients")).toBe(
        "Number of Clients"
      );
    });

    it("should remove [PERCENT] prefix", () => {
      expect(cleanKpiName("[PERCENT] Customer Satisfaction")).toBe(
        "Customer Satisfaction"
      );
    });

    it("should return unchanged name if no prefix", () => {
      expect(cleanKpiName("Total Revenue")).toBe("Total Revenue");
    });
  });
});
