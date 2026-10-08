import { describe, expect, it } from "vitest";

import { normalizeMetricObservationValue } from "./metric-observation-value";

describe("normalizeMetricObservationValue", () => {
  it("preserves an ungrouped exact decimal", () => {
    expect(normalizeMetricObservationValue("2325000.0")).toBe("2325000.0");
  });

  it("removes valid thousands separators without changing precision", () => {
    expect(normalizeMetricObservationValue("2,325,000.0")).toBe("2325000.0");
    expect(normalizeMetricObservationValue("-4,635,000.0001")).toBe(
      "-4635000.0001",
    );
  });

  it("rejects malformed grouping instead of changing the number", () => {
    expect(normalizeMetricObservationValue("12,34.5")).toBeNull();
    expect(normalizeMetricObservationValue("1,000,00")).toBeNull();
  });
});
