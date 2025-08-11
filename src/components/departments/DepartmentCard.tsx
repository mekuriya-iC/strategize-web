"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Department } from "@/types/graphql";
import { Building2 } from "lucide-react";

interface DepartmentCardProps {
  department: Department;
  selected?: boolean;
  onClick?: () => void;
}

export default function DepartmentCard({
  department,
  selected = false,
  onClick,
}: DepartmentCardProps) {
  return (
    <Card
      className={`bg-white border border-[#E2E8F0] rounded-xl shadow-[0_3.6px_90px_4.5px_rgba(0,0,0,0.07)] flex flex-col items-center p-8 transition-all gap-2 hover:shadow-lg cursor-pointer ${
        selected ? "ring-2 ring-[#3838EC]" : ""
      }`}
      onClick={onClick}
    >
      <div className="mb-5 text-5xl text-blue-600">
        <Building2 className="w-12 h-12" />
      </div>

      <div className="font-semibold text-lg text-primary text-center">
        {department.name}
      </div>

      {department.manager && (
        <div className="text-sm text-[#09090B] mb-2 text-center">
          Manager: {department.manager.fullName}
        </div>
      )}

      {department.division && (
        <div className="text-xs text-gray-500 mb-4 text-center">
          Division: {department.division.name}
        </div>
      )}

      <Button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className="w-full bg-primary cursor-pointer text-white hover:bg-primary/90"
      >
        Select Department
      </Button>
    </Card>
  );
}
