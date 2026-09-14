import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddTaskDialog } from "./AddTaskDialog";
import type { PropsWithChildren } from "react";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  user: { employeeId: "owner" },
  kpi: {
    kpiId: "kpi",
    name: "Delivery rate",
    status: "APPROVED",
    quarterPlans: [{ status: "APPROVED" }],
  },
}));
vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@apollo/client")>()),
  useMutation: () => [mocks.save, { loading: false }],
  useQuery: () => ({
    data: {
      myKpis: { items: [mocks.kpi] },
      initiatives: { items: [] },
      employees: { items: [] },
    },
  }),
}));
vi.mock("@/stores", () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ user: mocks.user }),
}));
vi.mock("@/utils/fileUpload", () => ({ uploadFile: vi.fn() }));
vi.mock("@/utils/error-handling", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), warning: vi.fn() } }));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: PropsWithChildren) => <div>{children}</div>,
  DialogContent: ({ children }: PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: PropsWithChildren) => <h2>{children}</h2>,
}));
vi.mock("@/components/ui/checkbox-select", () => ({
  CheckboxSelect: () => null,
}));
vi.mock("@/components/ui/time-picker", () => ({ TimePicker: () => null }));

const task = {
  id: "task",
  taskType: "KPI_FULFILLED",
  task: "Deliver approved client result",
  description: "Complete and verify the requested client delivery.",
  linkedKpiId: "kpi",
  linkedKpiName: "Delivery rate",
  relatedToEmployeeId: "",
  startTime: "2026-07-21T08:00:00.000Z",
  endTime: "2026-07-21T10:00:00.000Z",
  checkoutStatus: "DONE",
  submissionStatus: "DRAFT",
  isMidWeekTask: false,
  planningRevision: 2,
  planningReviewHistory: [{ decision: "REJECTED", revision: 2 }],
};
const session = { weekEndDate: "2026-07-26", isLocked: false };
beforeEach(() => {
  mocks.save
    .mockReset()
    .mockResolvedValue({
      data: { updateCheckinoutTask: { checkinoutTaskId: "task" } },
    });
});
afterEach(cleanup);

describe("returned task planning editor", () => {
  it("edits a rejected-back-to-draft task and saves a new type without a collaboration operation", async () => {
    render(
      <AddTaskDialog
        open
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        editingTask={task}
        session={session}
      />,
    );
    const unmet = screen.getByRole("radio", {
      name: "KPI Unmet",
    }) as HTMLInputElement;
    expect(unmet.disabled).toBe(false);
    fireEvent.click(unmet);
    expect(unmet.checked).toBe(true);
    fireEvent.click(
      screen.getByRole("button", {
        name: /update task|save changes|save task/i,
      }),
    );
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    const input = mocks.save.mock.calls[0][0].variables.input;
    expect(input).toMatchObject({
      checkinoutTaskId: "task",
      taskLinkType: "KPI_UNMET",
      linkedKpiId: "kpi",
      taskStatus: "NOT_DONE",
    });
    expect(input).not.toHaveProperty("collaborationRequestMessage");
    expect(input).not.toHaveProperty("relatedToEmployeeId");
    expect(input).not.toHaveProperty("submissionStatus");
  });

  it("allows an unmet draft to become fulfilled", async () => {
    render(
      <AddTaskDialog
        open
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        editingTask={{
          ...task,
          taskType: "KPI_UNMET",
          checkoutStatus: "NOT_DONE",
        }}
        session={session}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "KPI Fulfilled" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /update task|save changes|save task/i,
      }),
    );
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(mocks.save.mock.calls[0][0].variables.input).toMatchObject({
      taskLinkType: "KPI_FULFILLED",
      taskStatus: "DONE",
    });
  });

  it.each(["APPROVED", "PENDING_APPROVAL"])(
    "keeps planning types read-only for %s tasks",
    (submissionStatus) => {
      render(
        <AddTaskDialog
          open
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
          editingTask={{ ...task, submissionStatus }}
          session={session}
        />,
      );
      for (const radio of screen.getAllByRole("radio"))
        expect((radio as HTMLInputElement).disabled).toBe(true);
    },
  );
});
