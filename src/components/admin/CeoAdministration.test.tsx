import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CeoAdministration from "./CeoAdministration";

const state = vi.hoisted(() => ({ error: undefined as Error | undefined }));
vi.mock("@/stores", () => ({
  useAuthStore: (selector: (value: unknown) => unknown) =>
    selector({ user: { role: "CEO", organizationId: "org" } }),
}));
vi.mock("@apollo/client", async (original) => ({
  ...(await original<typeof import("@apollo/client")>()),
  useQuery: () => ({
    loading: false,
    error: state.error,
    data: {
      employees: {
        items: [
          {
            employeeId: "leader",
            fullName: "Direct Leader",
            role: "DIRECTOR",
            status: "ACTIVE",
          },
        ],
        meta: { totalPages: 1, totalItems: 1 },
      },
      systemConfigurationByOrg: {
        organizationName: "Example Organization",
        requireApproval: true,
      },
    },
  }),
  useMutation: () => {
    throw new Error("CEO administration must not mount mutations");
  },
}));
afterEach(() => {
  cleanup();
  state.error = undefined;
});
describe("CEO read-only administration", () => {
  it("shows account roles and configuration without edit controls", () => {
    render(<CeoAdministration />);
    expect(screen.getByText("Direct Leader")).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: /save|create|delete|edit|grant|revoke/i,
      }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByText("Example Organization")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: /activity and audit/i })
        .getAttribute("href"),
    ).toBe("/dashboard/admin/logs");
  });
  it("reports loading failures rather than claiming there are no records", () => {
    state.error = new Error("Service unavailable");
    render(<CeoAdministration />);
    expect(screen.getByRole("alert").textContent).toContain(
      "Service unavailable",
    );
  });
});
