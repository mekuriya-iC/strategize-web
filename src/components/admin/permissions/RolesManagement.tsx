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
  Shield,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRoles } from "@/hooks/permissions/usePermissionManagement";
import CreateRoleDialog from "./CreateRoleDialog";
import EditRoleDialog from "./EditRoleDialog";
import RolePermissionsDialog from "./RolePermissionsDialog";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 10;

function RolesTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

export default function RolesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "system" | "custom">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [viewingPermissions, setViewingPermissions] = useState<any>(null);

  const { roles, meta, loading, refetch } = useRoles(currentPage, ITEMS_PER_PAGE, searchQuery);

  // Filter roles based on type
  const filteredRoles = useMemo(() => {
    return roles.filter((role: any) => {
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "system" && !role.isCustom) ||
        (typeFilter === "custom" && role.isCustom);
      return matchesType;
    });
  }, [roles, typeFilter]);

  const totalPages = Math.ceil((meta?.totalItems || 0) / ITEMS_PER_PAGE);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRoles.map((r: any) => r.roleId)));
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
    filteredRoles.length > 0 &&
    filteredRoles.every((r: any) => selectedIds.has(r.roleId));

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value as "all" | "system" | "custom");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Role Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage user roles with specific permissions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#3838EC] hover:bg-[#2828DC] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="system">System Roles</SelectItem>
              <SelectItem value="custom">Custom Roles</SelectItem>
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

      {/* Table */}
      <div className="bg-white dark:bg-[#18181b] rounded-lg border dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <RolesTableSkeleton />
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
                  Role Name
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Code
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Created
                </TableHead>
                <TableHead className="px-4 py-3 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {searchQuery || typeFilter !== "all"
                      ? "No roles match your search criteria"
                      : "No roles found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role: any, index: number) => (
                  <TableRow
                    key={role.roleId}
                    className={`border-b border-gray-100 dark:border-gray-800 ${
                      selectedIds.has(role.roleId)
                        ? "bg-blue-50 dark:bg-blue-950/30"
                        : index % 2 === 1
                        ? "bg-white dark:bg-transparent"
                        : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"
                    } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                  >
                    <TableCell className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.has(role.roleId)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(role.roleId, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {role.name}
                        </div>
                        {role.parentRole && (
                          <Badge variant="outline" className="text-xs">
                            Inherits from {role.parentRole.name}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {role.code}
                      </code>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-gray-600 dark:text-gray-400 max-w-xs">
                      <div className="truncate" title={role.description}>
                        {role.description || "No description"}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge
                        variant={role.isCustom ? "default" : "secondary"}
                        className={
                          role.isCustom
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }
                      >
                        {role.isCustom ? "Custom" : "System"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(role.createdAt).toLocaleDateString()}
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
                            onClick={() => setViewingPermissions(role)}
                            className="flex items-center gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            View Permissions
                          </DropdownMenuItem>
                          {role.isCustom && (
                            <DropdownMenuItem
                              onClick={() => setEditingRole(role)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Role
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
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, meta.totalItems)} of {meta.totalItems} roles
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
      <CreateRoleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(null)}
          onSuccess={() => {
            refetch();
            setEditingRole(null);
          }}
        />
      )}

      {viewingPermissions && (
        <RolePermissionsDialog
          role={viewingPermissions}
          open={!!viewingPermissions}
          onOpenChange={(open) => !open && setViewingPermissions(null)}
        />
      )}
    </div>
  );
}