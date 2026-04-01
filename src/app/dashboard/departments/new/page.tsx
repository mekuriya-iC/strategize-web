"use client";
import React from "react";
import { useRouter } from "next/navigation";
import AddDepartmentForm from "@/components/departments/AddDepartmentForm";

const AddDepartmentPage = () => {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 ">
      <div className=" dark:bg-muted  p-8">
        <h1 className="text-2xl font-bold mb-6">Add Department</h1>
        <AddDepartmentForm
          onSubmit={(data) => {
            console.log("Submitted department:", data);
          }}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
};

export default AddDepartmentPage;
