"use client";
import React, { useEffect, useState } from "react";
import { useDepartmentSelection } from "@/context/DepartmentSelectionContext";
import DepartmentSelectionModal from "./DepartmentSelectionModal";

/**
 * Component that automatically shows department selection modal
 * when an employee with multiple departments logs in
 */
export default function DepartmentSelectionPrompt() {
  const { needsSelection } = useDepartmentSelection();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (needsSelection) {
      setShowModal(true);
    }
  }, [needsSelection]);

  return (
    <DepartmentSelectionModal open={showModal} onOpenChange={setShowModal} />
  );
}
