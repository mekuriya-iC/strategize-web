"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartmentSelection } from "@/context/DepartmentSelectionContext";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Building2, RotateCcw } from "lucide-react";
import { useState } from "react";
import DepartmentSelectionModal from "./DepartmentSelectionModal";

interface DepartmentSelectorProps {
  className?: string;
}

export default function DepartmentSelector({
  className = "",
}: DepartmentSelectorProps) {
  const { user } = useUser();
  const { selected, setSelected, availableDepartments, isMultipleDepartments } =
    useDepartmentSelection();
  const [showModal, setShowModal] = useState(false);

  // Only show for normal users (employees) who have departments
  if (user?.role !== "NORMAL" || availableDepartments.length === 0) {
    return null;
  }

  const handleDepartmentChange = (departmentId: string) => {
    const department = availableDepartments.find(
      (d) => d.departmentId === departmentId
    );
    if (department) {
      setSelected({ department });
    }
  };

  const handleSwitchDepartment = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <Select
          value={selected?.department?.departmentId || ""}
          onValueChange={handleDepartmentChange}
        >
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <SelectValue placeholder="Select Department" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {availableDepartments.map((department) => (
              <SelectItem
                key={department.departmentId}
                value={department.departmentId}
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {department.name}
                    {department.division && ` (${department.division.name})`}
                  </span>
                  {department.manager && (
                    <span className="text-xs text-gray-500">
                      Manager: {department.manager.fullName}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isMultipleDepartments && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchDepartment}
            className="flex items-center gap-1 text-xs"
            title="Switch Department"
          >
            <RotateCcw className="w-3 h-3" />
            Switch
          </Button>
        )}
      </div>

      <DepartmentSelectionModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
