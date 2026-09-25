import { describe, expect, it } from "vitest";
import {
  getRolePermissions,
  getAssignableRoles,
  hasMinimumRole,
  isCorporateAdmin,
} from "./roles";
import { canRoleAccessRoute } from "./routePolicy";
import { getScopeLevel } from "./scopes";
import { canReviewLogbookOwner } from "../logbook/review-hierarchy";

describe("CEO observer role", () => {
  it("has organization-wide reads without inherited writes", () => {
    const permissions = getRolePermissions("CEO");
    expect(permissions).toEqual(
      expect.arrayContaining([
        "analytics:read_all",
        "reports:read_all",
        "logbook:approve",
        "admin:access_panel",
      ]),
    );
    expect(
      permissions.some((permission) =>
        /:(create|update|delete|assign|manage|submit|system_settings)/.test(
          permission,
        ),
      ),
    ).toBe(false);
    expect(
      permissions.some((permission) =>
        permission.startsWith("objectives:approve"),
      ),
    ).toBe(false);
    expect(isCorporateAdmin("CEO")).toBe(false);
    expect(hasMinimumRole("CEO", "MANAGER")).toBe(false);
    expect(hasMinimumRole("NORMAL", "CEO")).toBe(false);
    expect(getScopeLevel("CEO")).toBe("CORPORATE");
    expect(getAssignableRoles("CEO")).toEqual([]);
    expect(getAssignableRoles("SUPER_ADMIN")).toContain("CEO");
  });
  it.each([
    "/dashboard",
    "/dashboard/structure",
    "/dashboard/reports",
    "/dashboard/task-completion",
    "/dashboard/logbook",
    "/dashboard/approvals",
    "/dashboard/admin/permissions",
    "/dashboard/admin/system-config",
    "/dashboard/admin/logs",
  ])("allows monitoring at %s", (path) => {
    expect(canRoleAccessRoute("CEO", path)).toBe(true);
  });
  it.each([
    "/dashboard/objectives",
    "/dashboard/employees",
    "/dashboard/admin/kpi-formulas",
    "/dashboard/admin/new",
    "/dashboard/approvals/config",
    "/dashboard/checkin",
    "/dashboard/reports?tab=submissions",
    "/strategy-period/new",
    "/organization-template",
  ])("denies operational navigation at %s", (path) => {
    expect(canRoleAccessRoute("CEO", path)).toBe(false);
  });
});

describe("CEO leadership review presentation", () => {
  const ceo = { employeeId: "ceo", role: "CEO" };
  it("shows directly reporting directors only", () => {
    expect(
      canReviewLogbookOwner(
        { employeeId: "leader", role: "DIRECTOR", managerId: "ceo" },
        ceo,
      ),
    ).toBe(true);
    expect(
      canReviewLogbookOwner(
        { employeeId: "leader", role: "DIRECTOR", managerId: "someone-else" },
        ceo,
      ),
    ).toBe(false);
  });
  it("shows directly reporting department heads with or without a division", () => {
    const owner = { employeeId: "head", role: "MANAGER", managerId: "ceo" };
    expect(
      canReviewLogbookOwner(owner, ceo, [{ head: { employeeId: "head" } }]),
    ).toBe(true);
    expect(
      canReviewLogbookOwner(owner, ceo, [
        { head: { employeeId: "head" }, division: { divisionId: "division" } },
      ]),
    ).toBe(true);
  });
  it("never exposes approval for self, regular staff, or missing manager links", () => {
    expect(canReviewLogbookOwner({ ...ceo, managerId: "ceo" }, ceo)).toBe(
      false,
    );
    expect(
      canReviewLogbookOwner(
        { employeeId: "staff", role: "NORMAL", managerId: "ceo" },
        ceo,
      ),
    ).toBe(false);
    expect(
      canReviewLogbookOwner({ employeeId: "leader", role: "DIRECTOR" }, ceo),
    ).toBe(false);
  });
});
