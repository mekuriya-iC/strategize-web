import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Kpi } from "@/types/graphql";
import {
  FormulaQuarterPlanningCard,
  type FormulaQuarterPlanningCardHandle,
} from "./FormulaQuarterPlanningCard";

const { planningHook } = vi.hoisted(() => ({ planningHook: vi.fn() }));

vi.mock("@/hooks/kpi-formulas/useKpiFormulaQuarterPlanning", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/hooks/kpi-formulas/useKpiFormulaQuarterPlanning")
  >();
  return { ...actual, useKpiFormulaQuarterPlanning: planningHook };
});

const formulaKpi = {
  kpiId: "kpi-1",
  organizationId: "kpi-organization",
  calculationType: "RATIO_FORMULA",
  quarterPlans: [],
  targets: [],
} as unknown as Kpi;

function missingFormulaState() {
  return {
    approvedFormula: null,
    plans: [],
    loading: false,
    saving: false,
    error: undefined,
    saveMetricInputs: vi.fn(),
    saveComponentInputs: vi.fn(),
    refetchFormula: vi.fn().mockResolvedValue(null),
  };
}

afterEach(() => {
  cleanup();
  planningHook.mockReset();
});

describe("FormulaQuarterPlanningCard", () => {
  it("uses the KPI organization when loading its inherited formula", () => {
    planningHook.mockReturnValue(missingFormulaState());

    render(
      <FormulaQuarterPlanningCard
        kpi={formulaKpi}
        annualPeriodId="period-1"
        canEdit
      />,
    );

    expect(planningHook).toHaveBeenCalledWith({
      organizationId: "kpi-organization",
      kpiId: "kpi-1",
      annualPeriodId: "period-1",
      enabled: true,
    });
  });

  it("reports a missing strategic period instead of a missing formula", () => {
    planningHook.mockReturnValue(missingFormulaState());

    render(<FormulaQuarterPlanningCard kpi={formulaKpi} canEdit />);

    expect(screen.getByText("Strategic period required")).toBeTruthy();
  });

  it("fails preflight before the parent form can update a KPI", async () => {
    planningHook.mockReturnValue(missingFormulaState());
    const ref = createRef<FormulaQuarterPlanningCardHandle>();

    render(
      <FormulaQuarterPlanningCard
        ref={ref}
        kpi={formulaKpi}
        annualPeriodId="period-1"
        canEdit
      />,
    );

    await expect(ref.current?.validate()).rejects.toThrow(
      "This formula KPI has no approved formula definition.",
    );
  });
});
