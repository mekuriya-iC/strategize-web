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
import { X, Building2 } from "lucide-react";

// Simplified department type matching what useUserDepartments returns
interface UserDepartment {
  departmentId: string;
  name: string;
}

interface DepartmentSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DepartmentSelectionModal({
  open,
  onOpenChange,
}: DepartmentSelectionModalProps) {
  const { availableDepartments, setSelected } = useDepartmentSelection();

  const handleDepartmentSelect = (department: UserDepartment) => {
    setSelected({ department });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto p-0 bg-white rounded-2xl shadow-2xl border-0">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold text-gray-900 text-center mb-3">
                Select Your Department
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
                You belong to multiple departments. Please select which
                department context you&apos;d like to work in.
              </DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ml-4"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-8 pt-6">
          {availableDepartments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No departments found.</p>
              <p className="text-gray-400 text-sm mt-2">
                Please contact your administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
