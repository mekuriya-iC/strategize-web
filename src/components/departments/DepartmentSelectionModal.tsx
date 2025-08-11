"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDepartmentSelection } from "@/context/DepartmentSelectionContext";
import DepartmentCard from "./DepartmentCard";
import { Department } from "@/types/graphql";

interface DepartmentSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DepartmentSelectionModal({
  open,
  onOpenChange,
}: DepartmentSelectionModalProps) {
  const { availableDepartments, setSelected } = useDepartmentSelection();

  const handleDepartmentSelect = (department: Department) => {
    setSelected({ department });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center">
            Select Your Department
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            You belong to multiple departments. Please select which department
            context you&apos;d like to work in.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {availableDepartments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No departments found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableDepartments.map((department) => (
                <DepartmentCard
                  key={department.departmentId}
                  department={department}
                  onClick={() => handleDepartmentSelect(department)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
