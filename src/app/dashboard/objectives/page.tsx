"use client";
// import { ProgressSteps } from "@/components/objectives/ProgressSteps";
import ObjectivesApprovalTable from "@/components/objectives/ObjectivesApprovalTable";
// import DataCleanup from "@/components/admin/DataCleanup";

export default function ObjectivesPage() {
  return (
    <>
      <div className="min-h-[70vh]">
        <div className="mb-4">{/* <ProgressSteps currentStep={2} /> */}</div>

        {/* Show cleanup component for admins */}
        {/* Temporarily disabled due to foreign key constraints with submissions */}
        {/* {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
          <div className="mb-6">
            <DataCleanup />
          </div>
        )} */}

        <ObjectivesApprovalTable />
      </div>
    </>
  );
}
