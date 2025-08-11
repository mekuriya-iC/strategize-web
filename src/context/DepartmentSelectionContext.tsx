"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Department } from "@/types/graphql";
import { useUserDepartments } from "@/hooks/useUserDepartments";
import { useUser } from "@/context/UserContext";

interface DepartmentSelectionState {
  department: Department | null;
}

interface DepartmentSelectionContextType {
  selected: DepartmentSelectionState | null;
  setSelected: (val: DepartmentSelectionState) => void;
  availableDepartments: Department[];
  isMultipleDepartments: boolean;
  needsSelection: boolean;
}

const DepartmentSelectionContext = createContext<
  DepartmentSelectionContextType | undefined
>(undefined);

export function DepartmentSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useUser();
  const { departments, isMultipleDepartments, hasDepartments } =
    useUserDepartments();
  const [selected, setSelected] = useState<DepartmentSelectionState | null>(
    null
  );

  // Auto-select the first department for employees
  useEffect(() => {
    if (
      user?.role === "NORMAL" &&
      hasDepartments &&
      !selected &&
      departments.length > 0
    ) {
      setSelected({ department: departments[0] });
    }
  }, [user, departments, hasDepartments, selected]);

  // Determine if employee needs to make a selection
  const needsSelection =
    user?.role === "NORMAL" && isMultipleDepartments && !selected;

  return (
    <DepartmentSelectionContext.Provider
      value={{
        selected,
        setSelected,
        availableDepartments: departments,
        isMultipleDepartments,
        needsSelection,
      }}
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
