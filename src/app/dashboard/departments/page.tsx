"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
// Placeholder imports (to be implemented)
import DepartmentTable from "@/components/departments/DepartmentTable";
import DepartmentFilterBar from "@/components/departments/DepartmentFilterBar";

const DepartmentsPage = () => {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-muted rounded-xl shadow-sm border p-6">
        {/* Header and Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <div className="flex gap-2 items-center">
            <DepartmentFilterBar />
            <Button
              className="ml-2"
              onClick={() => router.push("/dashboard/departments/new")}
            >
              + Add Department
            </Button>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <DepartmentTable />
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
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
    </div>
  );
};

export default DepartmentsPage;
