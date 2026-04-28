"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, User } from "lucide-react";

// Allow both full Department and simplified UserDepartment
interface SimpleDepartment {
  departmentId: string;
  name: string;
  head?: { fullName: string } | null;
  division?: { name: string } | null;
}

interface DepartmentCardProps {
  department: SimpleDepartment;
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
      className={`bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center p-8 gap-4 cursor-pointer group ${
        selected
          ? "ring-2 ring-blue-500 border-blue-200 shadow-blue-100"
          : "hover:border-blue-200 hover:shadow-blue-50"
      }`}
      onClick={onClick}
    >
      {/* Icon Container */}
      <div
        className={`p-4 rounded-full transition-all duration-300 ${
          selected
            ? "bg-blue-100 text-blue-600"
            : "bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600"
        }`}
      >
        <Building2 className="w-8 h-8" />
      </div>

      {/* Department Name */}
      <div className="text-center">
        <h3
          className={`font-bold text-xl transition-colors duration-300 ${
            selected
              ? "text-blue-700"
              : "text-gray-900 group-hover:text-blue-700"
          }`}
        >
          {department.name}
        </h3>
      </div>

      {/* Department Info */}
      <div className="text-center space-y-2 w-full">
        {department.head && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Manager: {department.head.fullName}</span>
          </div>
        )}

        {department.division && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>Division: {department.division.name}</span>
          </div>
        )}
      </div>

      {/* Enhanced Button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={`w-full mt-4 transition-all duration-300 font-semibold text-sm py-3 px-6 rounded-xl ${
          selected
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
            : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        }`}
      >
        <span className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Select Department
        </span>
      </Button>
    </Card>
  );
}
