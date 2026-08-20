import { describe, expect, it } from "vitest";
import {
  getTaskBorderStyle,
  getTaskCategory,
  getTaskColors,
} from "./task-colors";

describe("task category colors", () => {
  it.each([
    "SELF_DEVELOPMENT_FULFILLED",
    "SELF_DEVELOPMENT_UNMET",
  ])("maps %s to the amber self-development category", (taskType) => {
    expect(getTaskColors(taskType).background).toContain("amber");
    expect(getTaskColors(taskType).border).toContain("amber");
    expect(getTaskCategory(taskType)).toMatchObject({
      label: "Self-Development",
      dotColor: "bg-amber-500",
    });
    expect(getTaskBorderStyle(taskType)).toContain("amber");
  });

  it.each([
    ["KPI_UNMET", "blue"],
    ["INITIATIVE_FULFILLED", "green"],
    ["UNLINKED", "gray"],
  ])("preserves the %s category color", (taskType, color) => {
    expect(getTaskColors(taskType).background).toContain(color);
  });
});
