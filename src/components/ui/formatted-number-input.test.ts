import { describe, expect, it } from "vitest";

import {
  formatNumberInputValue,
  normalizeFormattedNumberInput,
} from "./formatted-number-input";

describe("formatted number input", () => {
  it("groups a full currency amount without changing its numeric value", () => {
    expect(formatNumberInputValue("283654789")).toBe("283,654,789");
    expect(normalizeFormattedNumberInput("283,654,789")).toBe("283654789");
  });

  it("preserves decimal input", () => {
    expect(formatNumberInputValue("283654789.50")).toBe("283,654,789.50");
    expect(normalizeFormattedNumberInput("283,654,789.50")).toBe(
      "283654789.50",
    );
  });

  it("rejects non-numeric characters", () => {
    expect(normalizeFormattedNumberInput("283 million")).toBeNull();
  });
});
