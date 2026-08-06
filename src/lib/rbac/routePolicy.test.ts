import { describe, expect, it } from "vitest";
import {
  canRoleAccessRoute,
  getRouteRoleRequirement,
  isProtectedRoute,
} from "./routePolicy";

const roles = [
  "NORMAL",
  "COORDINATOR",
  "MANAGER",
  "DIRECTOR",
  "HR",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

describe("route policy", () => {
  it("keeps the structure viewer available to every authenticated role", () => {
    for (const role of roles) {
      expect(canRoleAccessRoute(role, "/dashboard/structure")).toBe(true);
    }
  });

  it("allows every authenticated role to view strategic periods", () => {
    for (const role of roles) {
      expect(canRoleAccessRoute(role, "/strategy-period")).toBe(true);
    }
    expect(canRoleAccessRoute(undefined, "/strategy-period")).toBe(false);
    expect(getRouteRoleRequirement("/strategy-period")).toBe("NORMAL");
  });

  it("restricts new strategic periods to super admins", () => {
    for (const role of roles) {
      expect(canRoleAccessRoute(role, "/strategy-period/new")).toBe(
        role === "SUPER_ADMIN",
      );
    }
    expect(getRouteRoleRequirement("/strategy-period/new")).toBe("SUPER_ADMIN");
  });

  it.each([
    "/organization-template",
    "/org-structure/new",
    "/org-structure/builder",
  ])("restricts structure creation route %s to super admins", (route) => {
    expect(canRoleAccessRoute("SUPER_ADMIN", route)).toBe(true);
    expect(canRoleAccessRoute("ADMIN", route)).toBe(false);
    expect(canRoleAccessRoute("HR", route)).toBe(false);
    expect(getRouteRoleRequirement(route)).toBe("SUPER_ADMIN");
  });

  it("allows the employees route to managers and higher roles", () => {
    expect(canRoleAccessRoute("NORMAL", "/dashboard/employees")).toBe(false);
    expect(canRoleAccessRoute("COORDINATOR", "/dashboard/employees")).toBe(false);

    for (const role of ["MANAGER", "DIRECTOR", "HR", "ADMIN", "SUPER_ADMIN"]) {
      expect(canRoleAccessRoute(role, "/dashboard/employees")).toBe(true);
    }
  });

  it.each([
    ["positions", "/dashboard/positions", "/dashboard/positions/position-1"],
    ["teams", "/dashboard/teams", "/dashboard/teams/team-1"],
  ])("restricts %s and nested pages to HR and super admins", (_, listRoute, detailRoute) => {
    for (const route of [listRoute, detailRoute]) {
      expect(canRoleAccessRoute("HR", route)).toBe(true);
      expect(canRoleAccessRoute("SUPER_ADMIN", route)).toBe(true);
      expect(canRoleAccessRoute("ADMIN", route)).toBe(false);
      expect(canRoleAccessRoute("DIRECTOR", route)).toBe(false);
      expect(getRouteRoleRequirement(route)).toBe("HR_OR_SUPER_ADMIN");
    }
  });

  it("treats top-level structure creation routes as protected", () => {
    expect(isProtectedRoute("/organization-template")).toBe(true);
    expect(isProtectedRoute("/org-structure/new")).toBe(true);
    expect(isProtectedRoute("/dashboard/structure")).toBe(true);
    expect(isProtectedRoute("/auth")).toBe(false);
  });
});
