"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Employee } from "@/types/graphql";
import AdminTableRow from "./AdminTableRow";
import AddAdminDialog from "./AddAdminDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminTableProps {
  admins: Employee[];
  loading?: boolean;
  onRefetch?: () => void;
  canManageAdmins?: boolean;
}

const ITEMS_PER_PAGE = 8;

function AdminTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

export default function AdminTable({
  admins,
  loading,
  onRefetch,
  canManageAdmins = false,
}: AdminTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ACTIVE" | "INACTIVE"
  >("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Filter admins based on search and status
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        admin.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "ACTIVE" && admin.status === "ACTIVE") ||
        (statusFilter === "INACTIVE" && admin.status !== "ACTIVE");
      return matchesSearch && matchesStatus;
    });
  }, [admins, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedAdmins.map((a) => a.employeeId)));
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
    paginatedAdmins.length > 0 &&
    paginatedAdmins.every((a) => selectedIds.has(a.employeeId));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">All Admins</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 w-full sm:w-48"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as "all" | "ACTIVE" | "INACTIVE");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-28">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Admin Button - Only shown to super admins */}
            {canManageAdmins && (
              <AddAdminDialog onAddSuccess={onRefetch}>
                <Button className="bg-[#3838EC] hover:bg-[#2828DC] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Admin
                </Button>
              </AddAdminDialog>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-6">
          <AdminTableSkeleton />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-100">
              <TableHead className="px-4 py-3 w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Full Name
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Role
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Username
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Password
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAdmins.length === 0 ? (
              <TableRow>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  {searchQuery || statusFilter !== "all"
                    ? "No admins match your search criteria"
                    : "No admins found"}
                </td>
              </TableRow>
            ) : (
              paginatedAdmins.map((admin, index) => (
                <AdminTableRow
                  key={admin.employeeId}
                  admin={admin}
                  index={index}
                  selected={selectedIds.has(admin.employeeId)}
                  onSelect={(checked) =>
                    handleSelectOne(admin.employeeId, checked)
                  }
                  onEditSuccess={onRefetch}
                  onDeleteSuccess={onRefetch}
                  canManageAdmins={canManageAdmins}
                />
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {!loading && filteredAdmins.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing Page {currentPage} of {totalPages}
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
            {/* Page numbers */}
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


