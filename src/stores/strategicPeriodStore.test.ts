import { beforeEach, describe, expect, it } from "vitest";
import type { StrategicPeriod } from "@/types/graphql";
import { useStrategicPeriodStore } from "./strategicPeriodStore";

const period = {
  strategicPeriodId: "period-1",
  name: "2026/27",
  startDate: "2026-07-01",
  endDate: "2027-06-30",
} as StrategicPeriod;

describe("strategicPeriodStore", () => {
  beforeEach(() => {
    useStrategicPeriodStore.setState({
      selectedPeriod: null,
      annualTimeline: null,
      selectionValidated: false,
    });
    sessionStorage.clear();
  });

  it("does not persist validation from a previous authenticated context", () => {
    const store = useStrategicPeriodStore.getState();

    store.selectPeriodWithTimeline(period, "2026/27");
    store.setSelectionValidated(true);

    expect(useStrategicPeriodStore.getState().selectionValidated).toBe(true);

    const persisted = JSON.parse(
      sessionStorage.getItem("strategic-period-storage") ?? "{}",
    );
    expect(persisted.state.selectedPeriod.strategicPeriodId).toBe("period-1");
    expect(persisted.state.annualTimeline).toBe("2026/27");
    expect(persisted.state.selectionValidated).toBeUndefined();
  });

  it("clears the selected period, timeline, and validation together", () => {
    const store = useStrategicPeriodStore.getState();
    store.selectPeriodWithTimeline(period, "2026/27");
    store.setSelectionValidated(true);

    useStrategicPeriodStore.getState().clearSelection();

    expect(useStrategicPeriodStore.getState()).toMatchObject({
      selectedPeriod: null,
      annualTimeline: null,
      selectionValidated: false,
    });
  });
});
