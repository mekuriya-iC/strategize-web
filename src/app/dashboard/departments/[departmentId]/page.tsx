"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import DepartmentDetailsTable from "@/components/departments/DepartmentDetailsTable";

import DepartmentPagination from "@/components/departments/DepartmentPagination";

const DepartmentDetailsPage = () => {
  const router = useRouter();
 ;
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [loading] = useState(false);

  // For now, use a static department objective. In a real app, fetch by departmentId.
  const departmentObjective =
    "Operation Division";

  // Mock data for filtering (you can replace this with actual data)
  const totalItems = 15;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header and Back Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl md:text-4xl text-[#3F3F46] font-bold tracking-tight">
            {departmentObjective}
          </h1>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button>
          <Plus width={16} height={16} />
          Add Department
        </Button>
      </div>

      {/* Table */}
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <DepartmentDetailsTable />
      </div>

      {/* Pagination */}
      <DepartmentPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </div>
  );
};

export default DepartmentDetailsPage;
