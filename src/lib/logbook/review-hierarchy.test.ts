import { describe, expect, it } from "vitest";
import { canReviewLogbookOwner } from "./review-hierarchy";

const directDepartment = {
  departmentId: "direct-department",
  head: { employeeId: "direct-manager" },
  division: null,
};
const divisionDepartment = {
  departmentId: "division-department",
  head: { employeeId: "division-manager" },
  division: {
    divisionId: "division-1",
    head: { employeeId: "director-1" },
  },
};

describe("logbook review hierarchy", () => {
  it("lets corporate review directors and direct-to-corporate department managers", () => {
    const admin = { employeeId: "admin-1", role: "ADMIN" };
    expect(
      canReviewLogbookOwner(
        { employeeId: "director-1", role: "DIRECTOR" },
        admin,
        [directDepartment, divisionDepartment],
      ),
    ).toBe(true);
    expect(
      canReviewLogbookOwner(
        { employeeId: "direct-manager", role: "MANAGER" },
        admin,
        [directDepartment, divisionDepartment],
      ),
    ).toBe(true);
  });

  it("does not send managers inside a division to corporate", () => {
    expect(
      canReviewLogbookOwner(
        { employeeId: "division-manager", role: "MANAGER" },
        { employeeId: "admin-1", role: "SUPER_ADMIN" },
        [directDepartment, divisionDepartment],
      ),
    ).toBe(false);
  });

  it("lets a director review only managers under the headed division", () => {
    const director = { employeeId: "director-1", role: "DIRECTOR" };
    expect(
      canReviewLogbookOwner(
        { employeeId: "division-manager", role: "MANAGER" },
        director,
        [directDepartment, divisionDepartment],
      ),
    ).toBe(true);
    expect(
      canReviewLogbookOwner(
        { employeeId: "direct-manager", role: "MANAGER" },
        director,
        [directDepartment, divisionDepartment],
      ),
    ).toBe(false);
  });

  it("lets a manager review non-management department members but never self", () => {
    const manager = { employeeId: "division-manager", role: "MANAGER" };
    const employee = {
      employeeId: "employee-1",
      role: "NORMAL",
      departments: [
        {
          departmentId: "division-department",
          head: { employeeId: "division-manager" },
        },
      ],
    };
    expect(canReviewLogbookOwner(employee, manager)).toBe(true);
    expect(canReviewLogbookOwner(manager, manager)).toBe(false);
    expect(
      canReviewLogbookOwner(
        { employeeId: "other-manager", role: "MANAGER" },
        manager,
      ),
    ).toBe(false);
  });
});
