"use client";

import { useState } from "react";
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

  const filteredConfigs = configurations.filter(
    (config: any) =>
      config.configKey?.toLowerCase().includes(search.toLowerCase()) ||
      config.configValue?.toLowerCase().includes(search.toLowerCase()) ||
      config.description?.toLowerCase().includes(search.toLowerCase())
  );

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
              <TableHead>Configuration Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConfigs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {search ? "No configurations found matching your search" : "No configurations yet"}
                </TableCell>
              </TableRow>
            ) : (
              filteredConfigs.map((config: any) => (
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
