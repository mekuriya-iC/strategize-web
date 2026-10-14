import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LogbookAchievementDetails } from "./LogbookAchievementDetails";

vi.mock("@/components/files/AttachmentTrigger", () => ({
  AttachmentTrigger: ({ name }: { name: string }) => <span>{name}</span>,
}));

afterEach(cleanup);

describe("LogbookAchievementDetails", () => {
  it("shows the KPI, quarter, submitted values, and valid measured zero", () => {
    render(
      <LogbookAchievementDetails
        entry={{
          logbookEntryId: "entry-1",
          owner: { fullName: "Mulu Bekele", title: "Officer" },
          linkedKpi: {
            kpiId: "kpi-1",
            name: "Institutionalization Action Tracking Rate",
            measurementUnit: "%",
          },
          quarterPlan: { quarterNumber: 1, timeline: "2026/27-Q1" },
          kpiAchievedValue: 0,
          kpiTargetValue: 100,
          kpiCompletionPercent: 0,
        }}
      />,
    );

    expect(
      screen.getByText("Institutionalization Action Tracking Rate"),
    ).toBeTruthy();
    expect(screen.getByText(/Q1 · 2026\/27-Q1/)).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();
    const actual = screen.getByText("Submitted actual").parentElement;
    expect(actual).not.toBeNull();
    expect(within(actual!).getByText(/0 %/)).toBeTruthy();
  });

  it("clearly identifies an activity-only entry", () => {
    render(
      <LogbookAchievementDetails
        entry={{
          logbookEntryId: "entry-2",
          activityDescription: "Prepared quarterly report",
        }}
      />,
    );

    expect(screen.getByText("No KPI linked to this logbook")).toBeTruthy();
    expect(screen.getByText(/activity-only logbook entry/i)).toBeTruthy();
  });
});
