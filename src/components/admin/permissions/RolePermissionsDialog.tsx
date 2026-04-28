"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search,
  Shield,
  Plus,
  Minus,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { 
  useRolePermissions, 
  usePermissionDefinitions, 
  usePermissionMutations 
} from "@/hooks/permissions/usePermissionManagement";
import { Skeleton } from "@/components/ui/skeleton";

interface RolePermissionsDialogProps {
  role: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PermissionsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function RolePermissionsDialog({
  role,
  open,
  onOpenChange,
}: RolePermissionsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [showOnlyGranted, setShowOnlyGranted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  const { rolePermissions, loading: rolePermissionsLoading, refetch: refetchRolePermissions } = useRolePermissions(
    role?.roleId || "",
    1,
    1000 // Get all role permissions
  );

  const { permissions, loading: permissionsLoading } = usePermissionDefinitions(
    1,
    1000 // Get all available permissions
  );

  const { grantPermissionToRole, revokePermissionFromRole } = usePermissionMutations();

  // Create a map of granted permissions for quick lookup
  const grantedPermissions = useMemo(() => {
    const map = new Map();
    rolePermissions.forEach((rp: any) => {
      if (rp.isActive) {
        map.set(rp.permission.permissionDefinitionId, rp);
      }
    });
    return map;
  }, [rolePermissions]);

  // Get unique modules for filter
  const modules = useMemo(() => {
    const moduleSet = new Set<string>(permissions.map((p: any) => p.module as string));
    return Array.from(moduleSet).sort();
  }, [permissions]);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((permission: any) => {
      const matchesSearch =
        permission.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permission.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModule = moduleFilter === "all" || permission.module === moduleFilter;

      const isGranted = grantedPermissions.has(permission.permissionDefinitionId);
      const matchesGrantedFilter = !showOnlyGranted || isGranted;

      return matchesSearch && matchesModule && matchesGrantedFilter;
    });
  }, [permissions, searchQuery, moduleFilter, showOnlyGranted, grantedPermissions]);

  // Paginate filtered permissions
  const paginatedPermissions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPermissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPermissions, currentPage]);

  const totalPages = Math.ceil(filteredPermissions.length / ITEMS_PER_PAGE);

  const handleTogglePermission = async (permission: any) => {
    const isGranted = grantedPermissions.has(permission.permissionDefinitionId);
    setIsUpdating(permission.permissionDefinitionId);

    try {
      if (isGranted) {
        const rolePermission = grantedPermissions.get(permission.permissionDefinitionId);
        await revokePermissionFromRole(rolePermission.rolePermissionId);
      } else {
        await grantPermissionToRole(role.roleId, permission.permissionDefinitionId);
      }
      
      await refetchRolePermissions();
    } catch (error) {
      console.error("Failed to toggle permission:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleModuleFilter = (value: string) => {
    setModuleFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setModuleFilter("all");
    setShowOnlyGranted(false);
    setCurrentPage(1);
  };

  if (!role) return null;

  const loading = rolePermissionsLoading || permissionsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role Permissions: {role.name}
          </DialogTitle>
          <DialogDescription>
            Manage permissions for this role. Users with this role will inherit all granted permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>

              {/* Module Filter */}
              <Select value={moduleFilter} onValueChange={handleModuleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Show Only Granted */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="granted"
                  checked={showOnlyGranted}
                  onCheckedChange={(checked) => {
                    setShowOnlyGranted(!!checked);
                    setCurrentPage(1);
                  }}
                />
                <label htmlFor="granted" className="text-sm">
                  Show only granted
                </label>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || moduleFilter !== "all" || showOnlyGranted) && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {paginatedPermissions.length} of {filteredPermissions.length} permissions
            </span>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {grantedPermissions.size} granted
            </Badge>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto bg-white dark:bg-[#18181b] rounded-lg border dark:border-gray-800">
            {loading ? (
              <div className="p-6">
                <PermissionsTableSkeleton />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Permission
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Module
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Action
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Scope
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-24">
                      Granted
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPermissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {searchQuery || moduleFilter !== "all" || showOnlyGranted
                          ? "No permissions match your search criteria"
                          : "No permissions found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPermissions.map((permission: any, index: number) => {
                      const isGranted = grantedPermissions.has(permission.permissionDefinitionId);
                      const isUpdatingThis = isUpdating === permission.permissionDefinitionId;

                      return (
                        <TableRow
                          key={permission.permissionDefinitionId}
                          className={`border-b border-gray-100 dark:border-gray-800 ${
                            isGranted
                              ? "bg-green-50 dark:bg-green-950/20"
                              : index % 2 === 1
                              ? "bg-white dark:bg-transparent"
                              : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"
                          } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                        >
                          <TableCell className="px-4 py-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {permission.label}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <code>{permission.code}</code>
                              </div>
                              {permission.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <Badge variant="outline" className="text-xs">
                              {permission.module.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                permission.action === "CREATE"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : permission.action === "DELETE"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : permission.action === "UPDATE"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : permission.action === "READ"
                                  ? "bg-gray-50 text-gray-700 border-gray-200"
                                  : ""
                              }`}
                            >
                              {permission.action.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                permission.scope === "ORGANIZATION"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : permission.scope === "DIVISION"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : permission.scope === "DEPARTMENT"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : permission.scope === "OWN"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : ""
                              }`}
                            >
                              {permission.scope.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <Button
                              variant={isGranted ? "destructive" : "default"}
                              size="sm"
                              onClick={() => handleTogglePermission(permission)}
                              disabled={isUpdatingThis}
                              className={
                                isGranted
                                  ? ""
                                  : "bg-green-600 hover:bg-green-700 text-white"
                              }
                            >
                              {isUpdatingThis ? (
                                "..."
                              ) : isGranted ? (
                                <>
                                  <Minus className="w-3 h-3 mr-1" />
                                  Revoke
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 mr-1" />
                                  Grant
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPermissions.length)} of {filteredPermissions.length} permissions
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
        </div>
      </DialogContent>
    </Dialog>
  );
}