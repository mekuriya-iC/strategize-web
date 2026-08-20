import { describe, expect, it } from "vitest";
import { DEFAULT_TASK_TYPE, TASK_TYPES } from "./task-form";

describe("check-in task form defaults", () => {
  it("keeps KPI_UNMET first and selected by default", () => {
    expect(DEFAULT_TASK_TYPE).toBe("KPI_UNMET");
    expect(TASK_TYPES[0]).toEqual({
      value: "KPI_UNMET",
      label: "KPI Unmet",
    });
  });

  it("uses the fulfilled and unmet self-development API values", () => {
    expect(TASK_TYPES.map((type) => type.value)).toContain(
      "SELF_DEVELOPMENT_FULFILLED",
    );
    expect(TASK_TYPES.map((type) => type.value)).toContain(
      "SELF_DEVELOPMENT_UNMET",
    );
  });
});
