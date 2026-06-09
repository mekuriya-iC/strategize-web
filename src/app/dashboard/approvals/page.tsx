"use client";
import SubmissionApprovalsTable from "@/components/approvals/SubmissionApprovalsTable";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_LOGBOOK_ENTRIES } from "@/lib/graphql/queries/logbook";
import { LogbookApprovalActions } from "@/components/logbook";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Eye, FileText, Link as LinkIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ApprovalsPage() {
  const router = useRouter();
  const { guards, isLoading } = usePermissions();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("objectives");
  const [logbookStatusFilter, setLogbookStatusFilter] = useState("all");
  const [selectedLogbookEntry, setSelectedLogbookEntry] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Get logbook entries for approval
  // NOTE: Backend returns ALL entries (filtered by status), frontend should filter by hierarchy
  // For now, we fetch all SUBMITTED entries and the user's role/permissions determine what they can approve
  const { data: logbookData, loading: logbookLoading, refetch: refetchLogbook } = useQuery(GET_LOGBOOK_ENTRIES, {
    variables: {
      entryStatus: logbookStatusFilter !== "all" ? logbookStatusFilter.toUpperCase() : undefined,
      limit: 100,
      page: 1,
    },
    skip: !user?.employeeId,
  });

  const logbookEntries = logbookData?.logbookEntries?.items || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SUBMITTED: { icon: Clock, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", label: "Pending" },
      APPROVED: { icon: CheckCircle2, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", label: "Approved" },
      REJECTED: { icon: XCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", label: "Rejected" },
      DRAFT: { icon: Clock, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", label: "Draft" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const handleViewDetails = (entry: any) => {
    setSelectedLogbookEntry(entry);
    setShowDetailDialog(true);
  };

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

          {/* Workflow Content - Tabbed View */}
          <div className="px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="objectives">Objectives & KPIs</TabsTrigger>
                <TabsTrigger value="logbook">Logbook Entries</TabsTrigger>
              </TabsList>
              
              <TabsContent value="objectives" className="mt-6">
                <SubmissionApprovalsTable listMode="inbound" />
              </TabsContent>
              
              <TabsContent value="logbook" className="mt-6 space-y-4">
                {/* Logbook Filter */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {logbookEntries.length} logbook {logbookEntries.length === 1 ? 'entry' : 'entries'}
                  </p>
                  <Select value={logbookStatusFilter} onValueChange={setLogbookStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Logbook Table */}
                {logbookLoading ? (
                  <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <div className="text-gray-500">Loading...</div>
                  </div>
                ) : logbookEntries.length === 0 ? (
                  <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No logbook entries found
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {logbookStatusFilter === "submitted" 
                        ? "There are no pending logbook entries to review."
                        : "No logbook entries match your filter."}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Employee</TableHead>
                          <TableHead className="font-semibold">Activity</TableHead>
                          <TableHead className="font-semibold">Contribution</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logbookEntries.map((entry: any) => (
                          <TableRow key={entry.logbookEntryId} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                            <TableCell>
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {format(new Date(entry.entryDate), "MMM d, yyyy")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(entry.entryDate), "h:mm a")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {entry.owner?.fullName || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {entry.owner?.title || ""}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-gray-900 dark:text-gray-100 max-w-md truncate">
                                {entry.activityDescription}
                              </p>
                            </TableCell>
                            <TableCell>
                              {entry.contributionUnit ? (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {entry.contributionUnit}
                                </span>
                              ) : entry.kpiCompletionPercent ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${Math.min(entry.kpiCompletionPercent, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {entry.kpiCompletionPercent}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(entry.entryStatus)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(entry)}
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                >
                                  <Eye className="mr-1.5 h-4 w-4" />
                                  View
                                </Button>
                                <LogbookApprovalActions
                                  logbookEntryId={entry.logbookEntryId}
                                  activityDescription={entry.activityDescription}
                                  currentStatus={entry.entryStatus}
                                  onSuccess={() => refetchLogbook()}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Logbook Entry Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Logbook Entry Details
            </DialogTitle>
          </DialogHeader>

          {selectedLogbookEntry && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <Label className="text-xs text-gray-500">Employee</Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedLogbookEntry.owner?.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedLogbookEntry.owner?.title}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date</Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(selectedLogbookEntry.entryDate), "MMMM d, yyyy")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(selectedLogbookEntry.entryDate), "h:mm a")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedLogbookEntry.entryStatus)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Submitted</Label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedLogbookEntry.submittedAt
                      ? format(new Date(selectedLogbookEntry.submittedAt), "MMM d, yyyy h:mm a")
                      : "Not submitted"}
                  </p>
                </div>
              </div>

              {/* Activity Description */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Activity Description
                </Label>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedLogbookEntry.activityDescription}
                  </p>
                </div>
              </div>

              {/* Evidence Description */}
              {selectedLogbookEntry.evidenceDescription && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Evidence of Performance
                  </Label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedLogbookEntry.evidenceDescription}
                    </p>
                  </div>
                </div>
              )}

              {/* Evidence URL */}
              {selectedLogbookEntry.evidenceUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Evidence Link
                  </Label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <a
                      href={selectedLogbookEntry.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
                    >
                      {selectedLogbookEntry.evidenceUrl}
                    </a>
                  </div>
                </div>
              )}

              {/* Decisions Made / Remark */}
              {selectedLogbookEntry.decisionsMade && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Remark / Decisions Made
                  </Label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedLogbookEntry.decisionsMade}
                    </p>
                  </div>
                </div>
              )}

              {/* Contribution */}
              <div className="grid grid-cols-2 gap-4">
                {selectedLogbookEntry.contributionUnit && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Contribution Unit
                    </Label>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedLogbookEntry.contributionUnit}
                      </p>
                    </div>
                  </div>
                )}

                {selectedLogbookEntry.kpiCompletionPercent && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      KPI Completion
                    </Label>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(selectedLogbookEntry.kpiCompletionPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedLogbookEntry.kpiCompletionPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lessons Learned */}
              {selectedLogbookEntry.lessonsLearned && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Lessons Learned
                  </Label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedLogbookEntry.lessonsLearned}
                    </p>
                  </div>
                </div>
              )}

              {/* Risks/Issues */}
              {selectedLogbookEntry.risksIssues && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Risks / Issues
                  </Label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedLogbookEntry.risksIssues}
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedLogbookEntry.rejectionReason && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Rejection Reason
                  </Label>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                      {selectedLogbookEntry.rejectionReason}
                    </p>
                  </div>
                </div>
              )}

              {/* Approval Info */}
              {selectedLogbookEntry.approvedBy && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs text-green-700 dark:text-green-300">
                        Approved By
                      </Label>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        {selectedLogbookEntry.approvedBy.fullName}
                      </p>
                    </div>
                    {selectedLogbookEntry.approvedAt && (
                      <div className="text-right">
                        <Label className="text-xs text-green-700 dark:text-green-300">
                          Approved On
                        </Label>
                        <p className="text-sm text-green-900 dark:text-green-100">
                          {format(new Date(selectedLogbookEntry.approvedAt), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedLogbookEntry.entryStatus === "SUBMITTED" && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailDialog(false)}
                  >
                    Close
                  </Button>
                  <LogbookApprovalActions
                    logbookEntryId={selectedLogbookEntry.logbookEntryId}
                    activityDescription={selectedLogbookEntry.activityDescription}
                    currentStatus={selectedLogbookEntry.entryStatus}
                    onSuccess={() => {
                      refetchLogbook();
                      setShowDetailDialog(false);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
