"use client";

import { useState, useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import { GET_LOGBOOK_ENTRIES } from "@/lib/graphql/queries/logbook";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { LogbookApprovalActions } from "@/components/logbook";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  canReviewLogbookOwner,
  type LogbookReviewDepartment as ReviewDepartment,
  type LogbookReviewUser as ReviewEmployee,
} from "@/lib/logbook/review-hierarchy";

/**
 * Logbook Approvals Page
 * For managers/supervisors to approve/reject logbook entries
 */
const GET_LOGBOOK_REVIEW_DEPARTMENTS = gql`
  query GetLogbookReviewDepartments($page: Int!, $limit: Int!) {
    departments(page: $page, limit: $limit) {
      items {
        departmentId
        head {
          employeeId
        }
        division {
          divisionId
          head {
            employeeId
          }
        }
      }
    }
  }
`;


type ReviewLogbookEntry = {
  logbookEntryId: string;
  entryDate: string;
  activityDescription?: string | null;
  entryStatus?: string | null;
  kpiCompletionPercent?: number | null;
  owner?:
    | (ReviewEmployee & { fullName?: string | null; title?: string | null })
    | null;
};

const normalizeStatus = (status?: string | null) =>
  String(status || "").toUpperCase();

export default function LogbookApprovalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("SUBMITTED");

  const { data: meData, loading: meLoading } = useQuery(GET_ME);
  const currentUser = meData?.me;
  const { data: departmentsData, loading: departmentsLoading } = useQuery(
    GET_LOGBOOK_REVIEW_DEPARTMENTS,
    {
      variables: { page: 1, limit: 1000 },
    },
  );
  const departments = useMemo<ReviewDepartment[]>(
    () => departmentsData?.departments?.items || [],
    [departmentsData],
  );

  // Get logbook entries pending approval
  const { data, loading, refetch } = useQuery(GET_LOGBOOK_ENTRIES, {
    variables: {
      entryStatus: statusFilter !== "ALL" ? statusFilter : undefined,
      approverUserId: currentUser?.employeeId,
      limit: 100,
      page: 1,
    },
    skip: !currentUser?.employeeId,
  });

  const entries = useMemo<ReviewLogbookEntry[]>(
    () => data?.logbookEntries?.items || [],
    [data],
  );

  const approvableEntries = useMemo(
    () =>
      entries.filter((entry) =>
        canReviewLogbookOwner(entry.owner, currentUser, departments),
      ),
    [entries, currentUser, departments],
  );

  // Filter by approval hierarchy first, then search.
  const filteredEntries = useMemo(() => {
    if (!searchQuery) return approvableEntries;

    const query = searchQuery.toLowerCase();
    return approvableEntries.filter(
      (entry) =>
        entry.activityDescription?.toLowerCase().includes(query) ||
        entry.owner?.fullName?.toLowerCase().includes(query),
    );
  }, [approvableEntries, searchQuery]);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    const statusConfig = {
      SUBMITTED: {
        icon: Clock,
        color:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        label: "Pending",
      },
      APPROVED: {
        icon: CheckCircle2,
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        label: "Approved",
      },
      REJECTED: {
        icon: XCircle,
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        label: "Rejected",
      },
      DRAFT: {
        icon: Clock,
        color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
        label: "Draft",
      },
    };

    const config =
      statusConfig[normalizedStatus as keyof typeof statusConfig] ||
      statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Logbook Approvals
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Review and approve logbook entries from your team
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="SUBMITTED">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading || meLoading || departmentsLoading ? (
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No entries found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {statusFilter === "SUBMITTED"
              ? "There are no pending logbook entries to review."
              : "No logbook entries match your filters."}
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
                <TableHead className="font-semibold">KPI Progress</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow
                  key={entry.logbookEntryId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                >
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
                    {entry.kpiCompletionPercent ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(entry.kpiCompletionPercent, 100)}%`,
                            }}
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
                    {getStatusBadge(entry.entryStatus || "")}
                  </TableCell>
                  <TableCell>
                    <LogbookApprovalActions
                      logbookEntryId={entry.logbookEntryId}
                      activityDescription={entry.activityDescription || ""}
                      currentStatus={entry.entryStatus || ""}
                      onSuccess={() => refetch()}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {
                  approvableEntries.filter(
                    (e) => normalizeStatus(e.entryStatus) === "SUBMITTED",
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Pending
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {
                  approvableEntries.filter(
                    (e) => normalizeStatus(e.entryStatus) === "APPROVED",
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Approved
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {
                  approvableEntries.filter(
                    (e) => normalizeStatus(e.entryStatus) === "REJECTED",
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Rejected
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {approvableEntries.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
