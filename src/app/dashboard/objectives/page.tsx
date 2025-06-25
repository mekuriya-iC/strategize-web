"use client";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/objectives/EmptyState";
import { ProgressSteps } from "@/components/objectives/ProgressSteps";
import ObjectivesApprovalTable from "@/components/objectives/ObjectivesApprovalTable";

export default function ObjectivesPage() {
  const router = useRouter();
  return (
    <>
    {/* <EmptyState/> */}
    <div className="min-h-[70vh]">
      <ProgressSteps currentStep={2} />
      <ObjectivesApprovalTable />
    </div>
    </>
  );
}
