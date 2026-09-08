import { describe, expect, it } from "vitest";
import { formulaPlanningLoadState } from "./useKpiFormulaQuarterPlanning";

describe("formulaPlanningLoadState", () => {
  it("loads an approved formula before an annual period is available", () => {
    expect(
      formulaPlanningLoadState({
        enabled: true,
        organizationId: "kpi-organization",
        kpiId: "kpi-1",
      }),
    ).toEqual({ canLoadFormula: true, canLoadPlans: false });
  });

  it("loads quarter plans only when the KPI period is available", () => {
    expect(
      formulaPlanningLoadState({
        enabled: true,
        organizationId: "kpi-organization",
        kpiId: "kpi-1",
        annualPeriodId: "period-1",
      }),
    ).toEqual({ canLoadFormula: true, canLoadPlans: true });
  });

  it("does not query formula data without the KPI organization", () => {
    expect(
      formulaPlanningLoadState({
        enabled: true,
        kpiId: "kpi-1",
        annualPeriodId: "period-1",
      }),
    ).toEqual({ canLoadFormula: false, canLoadPlans: false });
  });
});
