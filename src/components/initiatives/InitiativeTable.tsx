"use client";

import { useState } from "react";
import { type Initiative } from "@/hooks/initiatives/useInitiatives";
import InitiativeStatusBadge from "./InitiativeStatusBadge";
import EditInitiativeDialog from "./EditInitiativeDialog";
import DeleteInitiativeDialog from "./DeleteInitiativeDialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Pencil, Trash2, Eye, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";

interface InitiativeTableProps {
  initiatives: Initiative[];
  loading: boolean;
}

export default function InitiativeTable({ initiatives, loading }: InitiativeTableProps) {
  const router = useRouter();
  const [editInitiative, setEditInitiative] = useState<Initiative | null>(null);
  const [deleteInitiative, setDeleteInitiative] = useState<Initiative | null>(null);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="animate-pulse p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!initiatives.length) {
    return (
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No initiatives yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Create your first initiative to start tracking strategic execution.
        </p>
      </div>
    );
  }

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900/50">
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Scope</TableHead>
              <TableHead className="font-semibold">Progress</TableHead>
              <TableHead className="font-semibold">Owner</TableHead>
              <TableHead className="font-semibold">Timeline</TableHead>
              <TableHead className="font-semibold w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initiatives.map((initiative) => (
              <TableRow
                key={initiative.initiativeId}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                onClick={() => router.push(`/dashboard/initiatives/${initiative.initiativeId}`)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {initiative.title}
                    </p>
                    {initiative.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {initiative.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <InitiativeStatusBadge status={initiative.status} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {initiative.scopeType === "ORGANIZATION"
                      ? "Organization"
                      : initiative.scopeType.charAt(0) +
                        initiative.scopeType.slice(1).toLowerCase()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={initiative.completionPercentage} className="h-2 flex-1" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {initiative.completionPercentage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {initiative.owner?.fullName || "Unassigned"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(initiative.startDate)} — {formatDate(initiative.dueDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/initiatives/${initiative.initiativeId}`);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditInitiative(initiative);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteInitiative(initiative);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditInitiativeDialog
        open={!!editInitiative}
        onOpenChange={(open) => !open && setEditInitiative(null)}
        initiative={editInitiative}
      />
      <DeleteInitiativeDialog
        open={!!deleteInitiative}
        onOpenChange={(open) => !open && setDeleteInitiative(null)}
        initiative={deleteInitiative}
      />
    </>
  );
}
