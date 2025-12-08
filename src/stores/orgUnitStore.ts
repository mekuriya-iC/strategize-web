/**
 * Organization Unit Store
 * Manages selected division/department state
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Division, Department } from "@/types/graphql";
import { appLogger } from "@/lib/logger";

export type OrgUnitType = "division" | "department";

export interface OrgUnit {
  id: string;
  name: string;
  type: OrgUnitType;
  data: Division | Department;
}

interface OrgUnitState {
  // State
  selectedUnit: OrgUnit | null;

  // Actions
  setSelectedUnit: (unit: OrgUnit | null) => void;
  selectDivision: (division: Division) => void;
  selectDepartment: (department: Department) => void;
  clearSelection: () => void;
}

export const useOrgUnitStore = create<OrgUnitState>()(
  persist(
    (set) => ({
      // Initial state
      selectedUnit: null,

      // Set selected unit
      setSelectedUnit: (unit) => {
        set({ selectedUnit: unit });
        if (unit) {
          appLogger.debug("Org unit selected", {
            type: unit.type,
            name: unit.name,
          });
        }
      },

      // Select a division
      selectDivision: (division) => {
        const unit: OrgUnit = {
          id: division.divisionId,
          name: division.name,
          type: "division",
          data: division,
        };
        set({ selectedUnit: unit });
        appLogger.debug("Division selected", { name: division.name });
      },

      // Select a department
      selectDepartment: (department) => {
        const unit: OrgUnit = {
          id: department.departmentId,
          name: department.name,
          type: "department",
          data: department,
        };
        set({ selectedUnit: unit });
        appLogger.debug("Department selected", { name: department.name });
      },

      // Clear selection
      clearSelection: () => {
        set({ selectedUnit: null });
        appLogger.debug("Org unit selection cleared");
      },
    }),
    {
      name: "org-unit-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Selector hooks
export const useSelectedUnit = () =>
  useOrgUnitStore((state) => state.selectedUnit);
export const useSelectedDivision = () => {
  const unit = useOrgUnitStore((state) => state.selectedUnit);
  return unit?.type === "division" ? (unit.data as Division) : null;
};
export const useSelectedDepartment = () => {
  const unit = useOrgUnitStore((state) => state.selectedUnit);
  return unit?.type === "department" ? (unit.data as Department) : null;
};

