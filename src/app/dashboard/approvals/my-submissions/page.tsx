"use client";

import SubmissionApprovalsTable from "@/components/approvals/SubmissionApprovalsTable";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";

export default function MySubmissionsPage() {
  const router = useRouter();
  const { isLoading } = usePermissions();
  const user = useAuthStore((state) => state.user);

  const canTrackOwnSubmissions =
    user?.role === "DIRECTOR" || user?.role === "MANAGER";

  if (isLoading) {
    return (
      <div className="min-h-[70vh] p-6">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-gray-200 rounded mb-4" />
          <div className="h-6 w-96 bg-gray-200 rounded mb-8" />
        </div>
      </div>
    );
  }

  if (!canTrackOwnSubmissions) {
    return (
      <AccessDenied
        title="Access Denied"
        message="This page is for division and department managers tracking submissions they sent for approval."
        action={
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        }
      />
    );
  }

  return (
    <div className="min-h-[70vh]">
      <div className="space-y-6">
        <div className="px-6">
          <h1 className="text-3xl font-semibold text-gray-900">My Submissions</h1>
          <p className="text-gray-600 mt-2">
            Track objectives and KPIs you submitted for approval from your manager.
            Use the status filter to see pending, approved, or rejected items.
          </p>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            {user?.role === "DIRECTOR" ? (
              <p>
                Division submissions appear here after you submit for corporate
                approval. Corporate admins approve them from their approval queue.
              </p>
            ) : (
              <p>
                Department submissions appear here after you submit for division
                approval. Your division director approves them from their queue.
              </p>
            )}
          </div>
        </div>
        <div className="px-6">
          <SubmissionApprovalsTable listMode="outbound" />
        </div>
      </div>
    </div>
  );
}
