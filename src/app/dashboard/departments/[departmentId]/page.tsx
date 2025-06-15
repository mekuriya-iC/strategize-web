"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import DepartmentDetailsTable from "@/components/departments/DepartmentDetailsTable";

const DepartmentDetailsPage = () => {
  const router = useRouter();
  // For now, use a static department objective. In a real app, fetch by departmentId.
  const departmentObjective =
    "Deploy a learning management system across 3 departments";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-muted rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight">
              {departmentObjective}
            </h1>
          </div>
          <div className="flex gap-2 items-center">
            <Input type="text" placeholder="Search..." className="w-56" />
            <Button className="ml-2">+ Add Department</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <DepartmentDetailsTable />
        </div>
        {/* Pagination placeholder */}
        <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
          <span>Showing Page 3 of 15</span>
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

export default DepartmentDetailsPage;
