"use client";
import SubmissionApprovalsTable from "@/components/approvals/SubmissionApprovalsTable";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";

export default function ApprovalsPage() {
  const router = useRouter();
  const { guards, isLoading } = usePermissions();
  const user = useAuthStore((state) => state.user);

  // Show loading while checking permissions
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

  // Coordinators and above can access approvals
  // NORMAL users can only view their own submissions
  const canAccessApprovals = guards.isEmployee || guards.canApprove || guards.isCoordinator;

  if (!canAccessApprovals) {
    return (
      <AccessDenied
        title="Access Denied"
        message="You do not have permission to access this page."
        action={
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        }
      />
    );
  }

  // Determine if user is viewing their own submissions or approving others'
  const isViewingOwnSubmissions = guards.isEmployee;
  const canApproveSubmissions = guards.canApprove;

  return (
    <>
      <div className="min-h-[70vh]">
        {/* Page Content */}
        <div className="space-y-6">
          {/* Page Header */}
          <div className="px-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-semibold text-gray-900">
                {isViewingOwnSubmissions
                  ? "My Submissions"
                  : user?.role === "DIRECTOR" || user?.role === "MANAGER"
                    ? "Approve Requests"
                    : "Approval Requests"}
              </h1>
              {(guards.isAdmin || guards.isSuperAdmin) && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/approvals/config")}
                  className="gap-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Configure Workflow
                </Button>
              )}
            </div>
            <p className="text-gray-600">
              {isViewingOwnSubmissions
                ? "Track the status of your objective and KPI submissions"
                : "Review and approve submissions from your divisions, departments, or employees"}
            </p>

            {/* Info Box for Approvers (Managers, Directors, Admins) */}
            {canApproveSubmissions && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Approval Flow
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      {user?.role === "DIRECTOR" ? (
                        <p>
                          <strong>Department Objectives:</strong> Submissions from
                          departments in your division requesting your approval
                          <br />
                          <strong>Personnel Objectives:</strong> Submissions from
                          employees in your departments
                        </p>
                      ) : user?.role === "MANAGER" ? (
                        <p>
                          <strong>Personnel Objectives:</strong> Submissions from
                          employees in your department requesting your approval
                        </p>
                      ) : (
                        <p>
                          <strong>Division Objectives:</strong> Submissions from
                          divisions requesting corporate approval
                          <br />
                          <strong>Department Objectives:</strong> Submissions from
                          departments requesting approval from their division or
                          corporate
                          <br />
                          <strong>Personnel Objectives:</strong> Submissions from
                          employees requesting approval from their department
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box for Coordinators */}
            {guards.isCoordinator && !canApproveSubmissions && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-amber-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Coordinator View
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        As a coordinator, you can view submission status for your
                        unit but cannot approve submissions. Contact your manager
                        for approval actions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Workflow Content - Only Submission-Based Approval */}
          <div className="px-6">
            <SubmissionApprovalsTable listMode="inbound" />
          </div>
        </div>
      </div>
    </>
  );
}
