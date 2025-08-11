"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Division, Department } from "@/types/graphql";

type OrgUnit = (Division | Department) & {
  __typename: "Division" | "Department";
};

interface OrgUnitContextType {
  selectedUnit: OrgUnit | null;
  setSelectedUnit: (unit: OrgUnit | null) => void;
}

const OrgUnitContext = createContext<OrgUnitContextType | undefined>(undefined);

export const OrgUnitProvider = ({ children }: { children: ReactNode }) => {
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);

  return (
    <OrgUnitContext.Provider value={{ selectedUnit, setSelectedUnit }}>
      {children}
    </OrgUnitContext.Provider>
  );
};

export const useOrgUnit = () => {
  const context = useContext(OrgUnitContext);
  if (context === undefined) {
    throw new Error("useOrgUnit must be used within an OrgUnitProvider");
  }
  return context;
};
