import React from "react";
import { Button } from "@/components/ui/button";
// Placeholder imports (to be implemented)
import EmployeeTable from "@/components/employees/EmployeeTable";
import EmployeeFilterBar from "@/components/employees/EmployeeFilterBar";

const EmployeesPage = () => {
  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <EmployeeFilterBar />
        <div className="flex gap-2 items-center">
          <Button className="ml-2">+ Add Employee</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-muted rounded-xl shadow-sm border overflow-x-auto">
        <EmployeeTable />
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
        <span>Showing Page 1 of 1</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
