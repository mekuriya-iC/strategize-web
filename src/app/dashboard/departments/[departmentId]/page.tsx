"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ArrowLeft } from "lucide-react";
import DepartmentDetailsTable from "@/components/departments/DepartmentDetailsTable";
import { GET_DEPARTMENT } from "@/lib/graphql/queries/departments";
import type { Department } from "@/types/graphql";

interface DepartmentData {
  department: Department;
}

const DepartmentDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const departmentId = params.departmentId as string;

  // Fetch department details
  const {
    data: departmentData,
    loading,
    error,
  } = useQuery<DepartmentData>(GET_DEPARTMENT, {
    variables: { departmentId },
    fetchPolicy: "cache-and-network",
  });

  const department = departmentData?.department;

  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-800 rounded w-64"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl md:text-4xl text-[#3F3F46] dark:text-gray-100 font-bold tracking-tight">
            Department Details
          </h1>
        </div>
        <div className="p-8 text-center">
          <p className="text-red-600">
            Error loading department: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl md:text-4xl text-[#3F3F46] dark:text-gray-100 font-bold tracking-tight">
            Department Details
          </h1>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Department not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header and Back Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl md:text-4xl text-[#3F3F46] dark:text-gray-100 font-bold tracking-tight">
            {department.name}
          </h1>
        </div>
      </div>

      {/* Department Info Summary */}
      <div className="bg-white dark:bg-[#18181b] rounded-lg border dark:border-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Manager</h3>
            <p className="text-gray-900 dark:text-gray-100">
              {department.head?.fullName || "No Manager"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Division</h3>
            <p className="text-gray-900 dark:text-gray-100">
              {department.division?.name || "No Division"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total Members
            </h3>
            <p className="text-gray-900 dark:text-gray-100">{department.employees?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Department Details Table */}
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <DepartmentDetailsTable department={department} loading={false} />
      </div>
    </div>
  );
};

export default DepartmentDetailsPage;
