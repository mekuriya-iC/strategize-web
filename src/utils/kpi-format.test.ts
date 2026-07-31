import { describe, expect, it } from "vitest";

import type { Kpi } from "@/types/graphql";
import { formatKpiValue, getUnitLabel, getUnitName } from "./kpi-format";
import { getDetailedUnitLabel } from "./unitTypeDetection";

describe("KPI currency formatting", () => {
  it("uses full ETB values instead of a million-unit label", () => {
    expect(getUnitLabel("CURRENCY")).toBe("ETB");
    expect(getUnitName("CURRENCY")).toBe("Currency (ETB)");
    expect(
      getDetailedUnitLabel({ name: "Total Revenue", unitType: "CURRENCY" } as Kpi),
    ).toBe("ETB");
    expect(formatKpiValue(283654789, "CURRENCY")).toBe("283,654,789 ETB");
    expect(formatKpiValue(283654789.5, "CURRENCY")).toBe(
      "283,654,789.5 ETB",
    );
  });

  it("keeps compact currency suffixes unambiguous", () => {
    expect(formatKpiValue(283654789, "CURRENCY", { compact: true })).toBe(
      "283.7M ETB",
    );
  });
});
