import { describe, expect, it } from "vitest";
import { getLogbookPeriodFields } from "./logbook-entry-period";

describe("logbook achievement period", () => {
  it("uses the selected period only when creating an entry", () => {
    expect(getLogbookPeriodFields(false, "annual-new")).toEqual({
      strategicPeriodId: "annual-new",
    });
  });

  it("does not overwrite the stored period when editing observations", () => {
    const savedEntry = {
      strategicPeriodId: "annual-original",
      quarterPlanId: "approved-q1",
    };
    expect({
      ...savedEntry,
      ...getLogbookPeriodFields(true, "annual-other"),
    }).toEqual(savedEntry);
    expect(getLogbookPeriodFields(true, "annual-other")).not.toHaveProperty(
      "strategicPeriodId",
    );
  });

  it("does not substitute a dashboard period when a legacy entry omits its period", () => {
    expect(getLogbookPeriodFields(true)).toEqual({});
  });
});
