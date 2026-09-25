import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CeoLogbookMonitor } from "./CeoLogbookMonitor";

const state = vi.hoisted(() => ({
  calls: [] as Record<string, unknown>[],
  error: undefined as Error | undefined,
}));
vi.mock("@/stores", () => ({
  useStrategicPeriodStore: (selector: (value: unknown) => unknown) =>
    selector({ selectedPeriod: { strategicPeriodId: "period" } }),
}));
vi.mock("@/components/files/AttachmentTrigger", () => ({
  AttachmentList: () => <div>Evidence preview</div>,
}));
vi.mock("@apollo/client", async (original) => ({
  ...(await original<typeof import("@apollo/client")>()),
  useQuery: (
    _document: unknown,
    options: { variables: Record<string, unknown> },
  ) => {
    state.calls.push(options.variables);
    return {
      loading: false,
      error: state.error,
      data: {
        logbookEntries: {
          items: [
            {
              logbookEntryId: "entry",
              activityDescription: "Leadership delivery",
              entryDate: "2026-09-25",
              entryStatus: "SUBMITTED",
              owner: { fullName: "Leader" },
            },
          ],
          meta: { totalItems: 26, totalPages: 2 },
        },
      },
    };
  },
  useMutation: () => {
    throw new Error("CEO monitoring must not mount mutations");
  },
}));
afterEach(() => {
  cleanup();
  state.calls = [];
  state.error = undefined;
});
describe("CEO logbook monitoring", () => {
  it("uses real scoped results, offers pagination, and keeps approvals separate", () => {
    render(<CeoLogbookMonitor />);
    expect(screen.getByText("Leadership delivery")).toBeTruthy();
    expect(state.calls.at(-1)).toMatchObject({
      strategicPeriodId: "period",
      page: 1,
      limit: 25,
    });
    expect(
      screen.queryByRole("button", {
        name: /approve|reject|edit|delete|submit/i,
      }),
    ).toBeNull();
    expect(
      screen
        .getByRole("link", { name: /leadership approvals/i })
        .getAttribute("href"),
    ).toContain("/dashboard/approvals");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(state.calls.at(-1)?.page).toBe(2);
    fireEvent.change(screen.getByRole("combobox", { name: "Logbook status" }), {
      target: { value: "APPROVED" },
    });
    expect(state.calls.at(-1)).toMatchObject({
      page: 1,
      entryStatus: "APPROVED",
    });
  });
  it("shows errors instead of displaying stale entries as current results", () => {
    state.error = new Error("Service unavailable");
    render(<CeoLogbookMonitor />);
    expect(screen.getByRole("alert").textContent).toContain(
      "Service unavailable",
    );
    expect(screen.queryByText("Leadership delivery")).toBeNull();
  });
});
