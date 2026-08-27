"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { useAuthStore } from "@/stores";

// Simplified department type that matches what's returned from user query
interface UserDepartment {
  departmentId: string;
  name: string;
}

interface DepartmentSelectionState {
  department: UserDepartment | null;
}

interface DepartmentSelectionContextType {
  selected: DepartmentSelectionState | null;
  setSelected: (val: DepartmentSelectionState) => void;
  availableDepartments: UserDepartment[];
  isMultipleDepartments: boolean;
  needsSelection: boolean;
}

const EMPTY_DEPARTMENTS: UserDepartment[] = [];

const DepartmentSelectionContext = createContext<
  DepartmentSelectionContextType | undefined
>(undefined);

export function DepartmentSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const role = useAuthStore((state) => state.user?.role);
  const departments = useAuthStore(
    (state) => state.user?.departments ?? EMPTY_DEPARTMENTS
  );
  const isMultipleDepartments = departments.length > 1;
  const [selected, setSelected] = useState<DepartmentSelectionState | null>(
    null
  );

  const effectiveSelection = useMemo(
    () =>
      selected ??
      (role === "NORMAL" && departments.length > 0
        ? { department: departments[0] }
        : null),
    [selected, role, departments]
  );

  // Determine if employee needs to make a selection
  const needsSelection =
    role === "NORMAL" && isMultipleDepartments && !effectiveSelection;
  const value = useMemo<DepartmentSelectionContextType>(
    () => ({
      selected: effectiveSelection,
      setSelected,
      availableDepartments: departments,
      isMultipleDepartments,
      needsSelection,
    }),
    [effectiveSelection, departments, isMultipleDepartments, needsSelection]
  );

  return (
    <DepartmentSelectionContext.Provider
      value={value}
    >
      {children}
    </DepartmentSelectionContext.Provider>
  );
}

export function useDepartmentSelection() {
  const context = useContext(DepartmentSelectionContext);
  if (context === undefined) {
    throw new Error(
      "useDepartmentSelection must be used within a DepartmentSelectionProvider"
    );
  }
  return context;
}
