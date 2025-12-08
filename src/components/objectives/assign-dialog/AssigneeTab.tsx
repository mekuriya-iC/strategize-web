"use client";

import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import type { Division, Department, Employee } from "@/types/graphql";

interface AssigneeTabProps {
  type: "DIVISION" | "DEPARTMENT" | "PERSONNEL";
  searchTerm: string;
  onSearchChange: (value: string) => void;
  items: Division[] | Department[] | Employee[];
  selectedAssignees: string[];
  onAssigneeSelection: (assigneeId: string, checked: boolean) => void;
  loading?: boolean;
  error?: Error | null;
}

export function AssigneeTab({
  type,
  searchTerm,
  onSearchChange,
  items,
  selectedAssignees,
  onAssigneeSelection,
  loading,
  error,
}: AssigneeTabProps) {
  const getDisplayName = (item: Division | Department | Employee) => {
    if (type === "PERSONNEL") {
      return (item as Employee).fullName;
    }
    return (item as Division | Department).name;
  };

  const getId = (item: Division | Department | Employee) => {
    if (type === "DIVISION") {
      return (item as Division).divisionId;
    } else if (type === "DEPARTMENT") {
      return (item as Department).departmentId;
    }
    return (item as Employee).employeeId;
  };

  const renderItemDetails = (item: Division | Department | Employee) => {
    switch (type) {
      case "DIVISION": {
        const division = item as Division;
        return (
          <>
            <p className="text-sm text-gray-500">
              Manager: {division.manager?.fullName || "No Manager"}
            </p>
            <p className="text-sm text-gray-500">
              Departments: {division.departments?.length || 0}
            </p>
          </>
        );
      }
      case "DEPARTMENT": {
        const department = item as Department;
        return (
          <>
            <p className="text-sm text-gray-500">
              Manager: {department.manager?.fullName || "No Manager"}
            </p>
            <p className="text-sm text-gray-500">
              Division: {department.division?.name || "No Division"}
            </p>
            <p className="text-sm text-gray-500">
              Employees: {department.employees?.length || 0}
            </p>
          </>
        );
      }
      case "PERSONNEL": {
        const employee = item as Employee;
        return (
          <>
            <p className="text-sm text-gray-500">Email: {employee.email}</p>
            <p className="text-sm text-gray-500">Role: {employee.role}</p>
            <p className="text-sm text-gray-500">Status: {employee.status}</p>
            {employee.departments && employee.departments.length > 0 && (
              <p className="text-sm text-gray-500">
                Department: {employee.departments.map((d) => d.name).join(", ")}
              </p>
            )}
          </>
        );
      }
    }
  };

  const pluralType = type === "DIVISION" ? "Divisions" : type === "DEPARTMENT" ? "Departments" : "Employees";

  return (
    <TabsContent value={type} className="space-y-4">
      <div className="space-y-2">
        <Label>Search {pluralType}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={`Search ${pluralType.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-2 max-h-48 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-gray-500">
            Loading {pluralType.toLowerCase()}...
          </div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500">
            Error loading {pluralType.toLowerCase()}: {error.message}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No {pluralType.toLowerCase()} found
          </div>
        )}
        {items.map((item) => {
          const id = getId(item);
          const name = getDisplayName(item);
          const isSelected = selectedAssignees.includes(id);

          return (
            <div
              key={id}
              className={`p-3 border rounded-lg transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    onAssigneeSelection(id, checked as boolean)
                  }
                />
                <div className="flex-1">
                  <h4 className="font-medium">{name}</h4>
                  {renderItemDetails(item)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </TabsContent>
  );
}

