"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ApprovalWorkflowConfig from "@/components/approvals/ApprovalWorkflowConfig";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";

export default function ApprovalConfigPage() {
  const router = useRouter();
  const { guards, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] p-6">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-gray-200 rounded mb-4" />
          <div className="h-6 w-96 bg-gray-200 rounded mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Only admins can configure workflows
  if (!guards.isAdmin && !guards.isSuperAdmin) {
    return (
      <AccessDenied
        title="Access Denied"
        message="Only administrators can configure approval workflows."
        action={
          <Button variant="outline" onClick={() => router.push("/dashboard/approvals")}>
            Back to Approvals
          </Button>
        }
      />
    );
  }

  return (
    <div className="min-h-[70vh] p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/approvals")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Approvals
      </Button>

      {/* Configuration Component */}
      <ApprovalWorkflowConfig
        onSave={(config) => {
          console.log("Workflow configuration saved:", config);
          // In a real implementation, this would save to backend
        }}
      />
    </div>
  );
}
