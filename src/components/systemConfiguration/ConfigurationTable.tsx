"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Search } from "lucide-react";
import { SystemConfiguration } from "@/hooks/systemConfiguration/useSystemConfiguration";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { SortableFilterableHeader } from "@/components/ui/sortable-filterable-header";
import { useTableColumnControls } from "@/hooks/table/useTableColumnControls";

interface ConfigurationTableProps {
  configurations: SystemConfiguration[];
  onEdit: (config: SystemConfiguration) => void;
  onDelete: (configId: string) => void;
  loading?: boolean;
}

export default function ConfigurationTable({
  configurations,
  onEdit,
  onDelete,
  loading = false,
}: ConfigurationTableProps) {
  const [search, setSearch] = useState("");

  const searchFiltered = useMemo(
    () =>
      configurations.filter(
        (config: any) =>
          config.configKey?.toLowerCase().includes(search.toLowerCase()) ||
          config.configValue?.toLowerCase().includes(search.toLowerCase()) ||
          config.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [configurations, search],
  );

  const columns = useMemo(
    () => [
      {
        id: "configKey",
        accessor: (row: any) => row.configKey ?? "",
      },
      {
        id: "configValue",
        accessor: (row: any) => row.configValue ?? "",
      },
      {
        id: "description",
        accessor: (row: any) => row.description ?? "",
      },
      {
        id: "status",
        accessor: (row: any) => (row.isActive ? "Active" : "Inactive"),
        filterFn: (row: any, value: string) =>
          (row.isActive ? "Active" : "Inactive") === value,
      },
      {
        id: "updatedAt",
        accessor: (row: any) =>
          row.updatedAt ? new Date(row.updatedAt) : new Date(row.createdAt),
      },
    ],
    [],
  );

  const { processedRows, getHeaderProps } = useTableColumnControls({
    rows: searchFiltered,
    columns,
  });

  const handleDelete = (config: any) => {
    toast(
      <div className="flex flex-col gap-2">
        <p className="font-semibold">Delete Configuration?</p>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete "{config.configKey}"? This action cannot be undone.
        </p>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              onDelete(config.systemConfigurationId);
              toast.dismiss();
            }}
          >
            Delete
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.dismiss()}>
            Cancel
          </Button>
        </div>
      </div>,
      {
        position: "top-center",
        duration: 10000,
      }
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search configurations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableFilterableHeader
                  label="Configuration Key"
                  {...getHeaderProps("configKey")}
                />
              </TableHead>
              <TableHead>
                <SortableFilterableHeader
                  label="Value"
                  {...getHeaderProps("configValue")}
                />
              </TableHead>
              <TableHead>
                <SortableFilterableHeader
                  label="Description"
                  {...getHeaderProps("description")}
                />
              </TableHead>
              <TableHead>
                <SortableFilterableHeader
                  label="Status"
                  filterType="select"
                  filterOptions={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                  {...getHeaderProps("status")}
                />
              </TableHead>
              <TableHead>
                <SortableFilterableHeader
                  label="Last Updated"
                  filterable={false}
                  {...getHeaderProps("updatedAt")}
                />
              </TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {search ? "No configurations found matching your search" : "No configurations yet"}
                </TableCell>
              </TableRow>
            ) : (
              processedRows.map((config: any) => (
                <TableRow key={config.systemConfigurationId}>
                  <TableCell className="font-mono text-sm font-medium">
                    {config.configKey}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {config.configValue}
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm text-gray-600">
                    {config.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {config.updatedAt
                      ? formatDistanceToNow(new Date(config.updatedAt), { addSuffix: true })
                      : formatDistanceToNow(new Date(config.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(config)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(config)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
