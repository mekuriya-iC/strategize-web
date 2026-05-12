"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  UserX,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { useUserRoleAssignments, useRoles } from "@/hooks/permissions/usePermissionManagement";
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import AssignRoleDialog from "./AssignRoleDialog";
import RevokeRoleDialog from "./RevokeRoleDialog";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 10;

function AssignmentsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

export default function UserRoleAssignments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "revoked">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [revokingAssignment, setRevokingAssignment] = useState<any>(null);

  const { assignments, meta, loading, refetch } = useUserRoleAssignments(
    undefined,
    undefined,
    currentPage,
    ITEMS_PER_PAGE
  );
  const { roles, loading: rolesLoading, error: rolesError, meta: rolesMeta } = useRoles(1, 100);
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
  });

  const employees = employeesData?.employees?.items || [];

  // Debug logging
  console.log('🔐 [UserRoleAssignments] Data fetched:', {
    rolesCount: roles?.length || 0,
    rolesLoading,
    rolesError: rolesError?.message,
    rolesMeta,
    roles: roles?.map((r: any) => ({ id: r.roleId, name: r.name, code: r.code })),
    employeesCount: employees?.length || 0
  });

  // Show error if roles failed to load
  if (rolesError) {
    console.error('🔐 [UserRoleAssignments] Error loading roles:', rolesError);
  }

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment: any) => {
      const matchesSearch =
        assignment.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.role.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || assignment.role.roleId === roleFilter;

      const now = new Date();
      const isExpired = assignment.expiresAt && new Date(assignment.expiresAt) < now;
      const isRevoked = assignment.revokedAt;
      const isActive = assignment.isActive && !isExpired && !isRevoked;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "expired" && isExpired) ||
        (statusFilter === "revoked" && isRevoked);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [assignments, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.ceil((meta?.totalItems || 0) / ITEMS_PER_PAGE);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAssignments.map((a: any) => a.userRoleAssignmentId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const allSelected =
    filteredAssignments.length > 0 &&
    filteredAssignments.every((a: any) => selectedIds.has(a.userRoleAssignmentId));

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (assignment: any) => {
    const now = new Date();
    const isExpired = assignment.expiresAt && new Date(assignment.expiresAt) < now;
    const isRevoked = assignment.revokedAt;

    if (isRevoked) {
      return (
        <Badge variant="destructive" className="text-xs">
          Revoked
        </Badge>
      );
    }

    if (isExpired) {
      return (
        <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
          Expired
        </Badge>
      );
    }

    if (assignment.isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs">
        Inactive
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Show error if roles failed to load */}
      {rolesError && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
            Error Loading Roles
          </h4>
          <p className="text-sm text-red-700 dark:text-red-400">
            {rolesError.message}
          </p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-2">
            Please check the browser console for more details.
          </p>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            User Role Assignments
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage role assignments for users across the organization
          </p>
        </div>
        <Button
          onClick={() => setShowAssignDialog(true)}
          className="bg-[#3838EC] hover:bg-[#2828DC] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Assign Role
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users or roles..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role: any) => (
                <SelectItem key={role.roleId} value={role.roleId}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "expired" | "revoked")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selected Count */}
        {selectedIds.size > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedIds.size} selected
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAssignments.length} of {meta?.totalItems || 0} role assignments
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#18181b] rounded-lg border dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <AssignmentsTableSkeleton />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <TableHead className="px-4 py-3 w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  User
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Role
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Assigned
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Expires
                </TableHead>
                <TableHead className="px-4 py-3 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                      ? "No assignments match your search criteria"
                      : "No role assignments found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssignments.map((assignment: any, index: number) => (
                  <TableRow
                    key={assignment.userRoleAssignmentId}
                    className={`border-b border-gray-100 dark:border-gray-800 ${
                      selectedIds.has(assignment.userRoleAssignmentId)
                        ? "bg-blue-50 dark:bg-blue-950/30"
                        : index % 2 === 1
                        ? "bg-white dark:bg-transparent"
                        : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"
                    } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                  >
                    <TableCell className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.has(assignment.userRoleAssignmentId)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(assignment.userRoleAssignmentId, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {assignment.user.fullName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {assignment.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {assignment.role.name}
                        </div>
                        {assignment.isPrimary && (
                          <Badge variant="outline" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      {getStatusBadge(assignment)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      <div>{new Date(assignment.createdAt).toLocaleDateString()}</div>
                      {assignment.assignedBy && (
                        <div className="text-xs text-gray-500">
                          by {assignment.assignedBy.fullName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {assignment.expiresAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(assignment.expiresAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {assignment.isActive && !assignment.revokedAt && (
                            <DropdownMenuItem
                              onClick={() => setRevokingAssignment(assignment)}
                              className="flex items-center gap-2 text-red-600"
                            >
                              <UserX className="h-4 w-4" />
                              Revoke Role
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, meta.totalItems)} of {meta.totalItems} assignments
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page
                        ? "bg-[#3838EC] hover:bg-[#2828DC]"
                        : ""
                    }
                  >
                    {page}
                  </Button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2 text-gray-400">...</span>
                  <Button
                    variant={currentPage === totalPages ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AssignRoleDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        employees={employees}
        roles={roles}
        onSuccess={() => {
          refetch();
          setShowAssignDialog(false);
        }}
      />

      {revokingAssignment && (
        <RevokeRoleDialog
          assignment={revokingAssignment}
          open={!!revokingAssignment}
          onOpenChange={(open) => !open && setRevokingAssignment(null)}
          onSuccess={() => {
            refetch();
            setRevokingAssignment(null);
          }}
        />
      )}
    </div>
  );
}