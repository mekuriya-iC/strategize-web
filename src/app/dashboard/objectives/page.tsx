"use client";
// import { ProgressSteps } from "@/components/objectives/ProgressSteps";
import ObjectivesApprovalTable from "@/components/objectives/ObjectivesApprovalTable";

export default function ObjectivesPage() {
  return (
    <>
      <div className="min-h-[70vh]">
        <div className="mb-4">
          {/* <ProgressSteps currentStep={2} /> */}
        </div>

        <ObjectivesApprovalTable />
      </div>
    </>
  );
}
