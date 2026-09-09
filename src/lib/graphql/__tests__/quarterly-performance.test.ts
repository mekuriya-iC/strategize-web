import { print } from "graphql";
import { describe, expect, it } from "vitest";
import { GET_KPI_QUARTER_PERFORMANCE_REPORT } from "../queries/quarterly-performance";

describe("quarterly performance GraphQL shape", () => {
  it("requests unpaginated quarter, unit, and contributor rollups", () => {
    const printed = print(GET_KPI_QUARTER_PERFORMANCE_REPORT);
    expect(printed).toContain("entityQuarterRollups {");
    expect(printed).toContain("kpiQuarterRollups {");
    expect(printed).toContain("entityKpiRollups {");
    expect(printed).toContain("quarterNumber");
    expect(printed).toContain("parentKpiId");
    expect(printed).toContain("divisionId");
    expect(printed).toContain("departmentId");
  });
});
