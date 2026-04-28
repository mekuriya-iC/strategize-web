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
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Key,
} from "lucide-react";
import { usePermissionDefinitions } from "@/hooks/permissions/usePermissionManagement";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 15;

function PermissionsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-64" />
        </div>
      ))}
    </div>
  );
}

export default function PermissionsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { permissions, meta, loading } = usePermissionDefinitions(
    currentPage,
    ITEMS_PER_PAGE,
    searchQuery
  );

  // Get unique values for filters
  const modules = useMemo(() => {
    const moduleSet = new Set<string>(permissions.map((p: any) => p.module as string));
    return Array.from(moduleSet).sort();
  }, [permissions]);

  const actions = useMemo(() => {
    const actionSet = new Set<string>(permissions.map((p: any) => p.action as string));
    return Array.from(actionSet).sort();
  }, [permissions]);

  const scopes = useMemo(() => {
    const scopeSet = new Set<string>(permissions.map((p: any) => p.scope as string));
    return Array.from(scopeSet).sort();
  }, [permissions]);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((permission: any) => {
      const matchesModule = moduleFilter === "all" || permission.module === moduleFilter;
      const matchesAction = actionFilter === "all" || permission.action === actionFilter;
      const matchesScope = scopeFilter === "all" || permission.scope === scopeFilter;

      return matchesModule && matchesAction && matchesScope;
    });
  }, [permissions, moduleFilter, actionFilter, scopeFilter]);

  const totalPages = Math.ceil((meta?.totalItems || 0) / ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setModuleFilter("all");
    setActionFilter("all");
    setScopeFilter("all");
    setCurrentPage(1);
  };

  // Group permissions by module for better organization
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredPermissions.forEach((permission: any) => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }
      groups[permission.module].push(permission);
    });
    return groups;
  }, [filteredPermissions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Permission Definitions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View all available permissions in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Key className="w-3 h-3" />
            {meta?.totalItems || 0} permissions
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
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
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
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

          {/* Action Filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Scope Filter */}
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Scopes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              {scopes.map((scope) => (
                <SelectItem key={scope} value={scope}>
                  {scope.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {(searchQuery || moduleFilter !== "all" || actionFilter !== "all" || scopeFilter !== "all") && (
          <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredPermissions.length} of {meta?.totalItems || 0} permissions
        {(searchQuery || moduleFilter !== "all" || actionFilter !== "all" || scopeFilter !== "all") && (
          <span className="ml-1">matching your filters</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#18181b] rounded-lg border dark:border-gray-800 overflow-hidden">
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
                  Code
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
                <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {searchQuery || moduleFilter !== "all" || actionFilter !== "all" || scopeFilter !== "all"
                      ? "No permissions match your search criteria"
                      : "No permissions found"}
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                  <>
                    {/* Module Header */}
                    <TableRow key={`header-${module}`} className="bg-gray-100 dark:bg-gray-800/30">
                      <TableCell colSpan={6} className="px-4 py-2">
                        <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                          <Shield className="w-4 h-4" />
                          {module.replace(/_/g, " ")}
                          <Badge variant="outline" className="ml-auto">
                            {modulePermissions.length} permissions
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Module Permissions */}
                    {modulePermissions.map((permission: any, index: number) => (
                      <TableRow
                        key={permission.permissionDefinitionId}
                        className={`border-b border-gray-100 dark:border-gray-800 ${
                          index % 2 === 1
                            ? "bg-white dark:bg-transparent"
                            : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"
                        } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                      >
                        <TableCell className="px-4 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {permission.label}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                            {permission.code}
                          </code>
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
                        <TableCell className="px-4 py-4 text-gray-600 dark:text-gray-400 max-w-xs">
                          <div className="truncate" title={permission.description}>
                            {permission.description || "No description"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
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
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, meta.totalItems)} of {meta.totalItems} permissions
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
  );
}