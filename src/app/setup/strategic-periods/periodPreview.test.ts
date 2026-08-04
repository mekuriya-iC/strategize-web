import { describe, expect, it } from "vitest";
import { getPreviewPeriodStatus } from "./periodPreview";

const start = new Date(2026, 0, 1);
const end = new Date(2026, 11, 31);
const current = new Date(2026, 7, 4);

describe("getPreviewPeriodStatus", () => {
  it("marks only a current annual period active", () => {
    expect(getPreviewPeriodStatus("ANNUAL", start, end, current)).toBe(
      "active",
    );
    expect(getPreviewPeriodStatus("QUARTERLY", start, end, current)).toBe(
      "current",
    );
    expect(getPreviewPeriodStatus("MONTHLY", start, end, current)).toBe(
      "current",
    );
  });

  it("retains upcoming and past context for every period type", () => {
    expect(
      getPreviewPeriodStatus("ANNUAL", start, end, new Date(2025, 11, 31)),
    ).toBe("upcoming");
    expect(
      getPreviewPeriodStatus("MONTHLY", start, end, new Date(2027, 0, 1)),
    ).toBe("past");
  });
});
