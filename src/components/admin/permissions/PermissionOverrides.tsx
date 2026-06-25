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
  Edit,
  Trash2,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { useUserPermissionOverrides, usePermissionDefinitions } from "@/hooks/permissions/usePermissionManagement";
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import CreatePermissionOverrideDialog from "./CreatePermissionOverrideDialog";
import EditPermissionOverrideDialog from "./EditPermissionOverrideDialog";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 10;

function OverridesTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

export default function PermissionOverrides() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "granted" | "denied">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOverride, setEditingOverride] = useState<any>(null);

  const { overrides, meta, loading, refetch } = useUserPermissionOverrides(
    userFilter === "all" ? undefined : userFilter,
    currentPage,
    ITEMS_PER_PAGE
  );
  const { permissions } = usePermissionDefinitions(1, 1000);
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
  });

  const employees = employeesData?.employees?.items || [];

  // Filter overrides
  const filteredOverrides = useMemo(() => {
    return overrides.filter((override: any) => {
      const matchesSearch =
        override.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        override.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        override.permission.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        override.permission.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "granted" && override.isGranted) ||
        (typeFilter === "denied" && !override.isGranted);

      const now = new Date();
      const isExpired = override.expiresAt && new Date(override.expiresAt) < now;
      const isActive = override.isActive && !isExpired;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "expired" && isExpired);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [overrides, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.ceil((meta?.totalItems || 0) / ITEMS_PER_PAGE);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredOverrides.map((o: any) => o.userPermissionOverrideId)));
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
    filteredOverrides.length > 0 &&
    filteredOverrides.every((o: any) => selectedIds.has(o.userPermissionOverrideId));

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (override: any) => {
    const now = new Date();
    const isExpired = override.expiresAt && new Date(override.expiresAt) < now;

    if (!override.isActive) {
      return (
        <Badge variant="destructive" className="text-xs">
          Disabled
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

    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
        Active
      </Badge>
    );
  };

  const getTypeBadge = (override: any) => {
    if (override.isGranted) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs flex items-center gap-1">
          <UserCheck className="w-3 h-3" />
          Granted
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs flex items-center gap-1">
          <UserX className="w-3 h-3" />
          Denied
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Permission Overrides
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Grant or deny specific permissions to individual users
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#3838EC] hover:bg-[#2828DC] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Override
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users or permissions..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          {/* User Filter */}
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {employees.map((employee: any) => (
                <SelectItem key={employee.employeeId} value={employee.employeeId}>
                  {employee.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | "granted" | "denied")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="granted">Granted</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "expired")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
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
        Showing {filteredOverrides.length} of {meta?.totalItems || 0} permission overrides
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#18181b] rounded-lg border dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <OverridesTableSkeleton />
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
                  Permission
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Expires
                </TableHead>
                <TableHead className="px-4 py-3 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOverrides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {searchQuery || userFilter !== "all" || typeFilter !== "all" || statusFilter !== "all"
                      ? "No overrides match your search criteria"
                      : "No permission overrides found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOverrides.map((override: any, index: number) => (
                  <TableRow
                    key={override.userPermissionOverrideId}
                    className={`border-b border-gray-100 dark:border-gray-800 ${
                      selectedIds.has(override.userPermissionOverrideId)
                        ? "bg-blue-50 dark:bg-blue-950/30"
                        : index % 2 === 1
                        ? "bg-white dark:bg-transparent"
                        : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"
                    } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                  >
                    <TableCell className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.has(override.userPermissionOverrideId)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(override.userPermissionOverrideId, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {override.user.fullName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {override.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {override.permission.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <code>{override.permission.code}</code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      {getTypeBadge(override)}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      {getStatusBadge(override)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {override.expiresAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(override.expiresAt).toLocaleDateString()}
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
                          <DropdownMenuItem
                            onClick={() => setEditingOverride(override)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Override
                          </DropdownMenuItem>
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
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, meta.totalItems)} of {meta.totalItems} overrides
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
      <CreatePermissionOverrideDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        employees={employees}
        permissions={permissions}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      {editingOverride && (
        <EditPermissionOverrideDialog
          override={editingOverride}
          open={!!editingOverride}
          onOpenChange={(open) => !open && setEditingOverride(null)}
          onSuccess={() => {
            refetch();
            setEditingOverride(null);
          }}
        />
      )}
    </div>
  );
}