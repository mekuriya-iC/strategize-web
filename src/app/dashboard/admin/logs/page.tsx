"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";
import { useActivityLogs, useAuditLogs } from "@/hooks/logs/useLogs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Activity, Eye, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState("activity");
  const router = useRouter();
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    );
  }

  if (!can("admin:view_audit_logs")) {
    return (
      <AccessDenied
        title="Access Denied"
        message="You do not have permission to view system logs. This area is restricted to administrators only."
        action={
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="mobile-heading font-bold text-gray-900 dark:text-gray-100">
                System Logs
              </h1>
              <p className="mobile-text text-gray-600 dark:text-gray-400 mt-0.5">
                Monitor system activity and audit trails
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity Logs</span>
            <span className="sm:hidden">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Trail</span>
            <span className="sm:hidden">Audit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          <ActivityLogsTab />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActivityLogsTab() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { activityLogs, meta, loading } = useActivityLogs({
    page,
    limit,
    isSuccessful: statusFilter === "ALL" ? undefined : statusFilter === "SUCCESS",
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="SUCCESS">Successful</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 table-container">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900/50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Event Summary</TableHead>
              <TableHead className="hidden md:table-cell">User</TableHead>
              <TableHead className="hidden lg:table-cell">Module</TableHead>
              <TableHead className="hidden xl:table-cell">IP Address</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading activity logs...
                </TableCell>
              </TableRow>
            ) : activityLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No activity logs found.
                </TableCell>
              </TableRow>
            ) : (
              activityLogs.map((log) => (
                <TableRow key={log.activityLogId} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <TableCell>
                    {log.isSuccessful ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {log.actionSummary}
                    </div>
                    {log.entityLabel && (
                      <div className="text-xs text-gray-500 mt-0.5">{log.entityLabel}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    {log.userEmail || "System/Anonymous"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline" className="font-normal text-xs bg-gray-50 dark:bg-gray-800">
                      {log.module}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 font-mono text-xs hidden xl:table-cell">
                    {log.ipAddress}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 hidden sm:table-cell">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedLog(log)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="mobile-text text-gray-500">
            Showing {(meta.currentPage - 1) * meta.itemsPerPage + 1} to{" "}
            {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)} of {meta.totalItems} entries
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>Detailed view of the system activity event.</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Event Type</span>
                  <Badge variant="secondary">{selectedLog.eventType}</Badge>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Status</span>
                  {selectedLog.isSuccessful ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Successful</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Summary</span>
                <p className="font-medium">{selectedLog.actionSummary}</p>
                {selectedLog.actionDetail && (
                  <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedLog.actionDetail}
                  </p>
                )}
                {selectedLog.failureReason && (
                  <p className="mt-2 text-red-600 dark:text-red-400">
                    <strong>Reason:</strong> {selectedLog.failureReason}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-3">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">User Email</span>
                  <span>{selectedLog.userEmail || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Date</span>
                  <span>{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Entity</span>
                  <span>{selectedLog.entityType || "N/A"} {selectedLog.entityId ? `(#${selectedLog.entityId.slice(0, 8)}...)` : ""}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Module</span>
                  <span>{selectedLog.module}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Network Info</span>
                <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                  IP: {selectedLog.ipAddress} <br/>
                  Agent: {selectedLog.userAgent} <br/>
                  Browser: {selectedLog.browser || "Unknown"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditLogsTab() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { auditLogs, meta, loading } = useAuditLogs({
    page,
    limit,
    action: actionFilter === "ALL" ? undefined : actionFilter,
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
            <SelectItem value="APPROVE">Approve</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 table-container">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900/50">
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">Entity Type</TableHead>
              <TableHead className="hidden lg:table-cell">Entity ID</TableHead>
              <TableHead className="hidden xl:table-cell">IP Address</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading audit trail...
                </TableCell>
              </TableRow>
            ) : auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.auditLogId} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100 hidden md:table-cell">
                    {log.entityType || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400 font-mono text-xs hidden lg:table-cell">
                    {log.entityId || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 font-mono text-xs hidden xl:table-cell">
                    {log.ipAddress || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 hidden sm:table-cell">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedLog(log)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="mobile-text text-gray-500">
            Showing {(meta.currentPage - 1) * meta.itemsPerPage + 1} to{" "}
            {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)} of {meta.totalItems} entries
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Audit Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Low-level audit trail record.</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Action</span>
                  <Badge variant="secondary">{selectedLog.action}</Badge>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Date</span>
                  <span>{formatDate(selectedLog.createdAt)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Entity Type</span>
                  <span className="font-medium">{selectedLog.entityType || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Entity ID</span>
                  <span className="font-mono text-xs">{selectedLog.entityId || "N/A"}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <span className="text-gray-500 dark:text-gray-400 block mb-1">System Info</span>
                <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                  IP: {selectedLog.ipAddress || "N/A"} <br/>
                  Agent: {selectedLog.userAgent || "N/A"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
