"use client";

import { useState } from "react";
import { type Position, usePositionMutations } from "@/hooks/positions/usePositions";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores";
import { MoreHorizontal, Pencil, Trash2, Eye, Briefcase, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PositionTableProps {
  positions: Position[];
  loading: boolean;
}

export default function PositionTable({ positions, loading }: PositionTableProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { createPosition, updatePosition, removePosition, loading: mutLoading } =
    usePositionMutations();

  const [showCreate, setShowCreate] = useState(false);
  const [editPosition, setEditPosition] = useState<Position | null>(null);
  const [deletePosition, setDeletePosition] = useState<Position | null>(null);

  const [form, setForm] = useState({ title: "", description: "", grade: "" });

  const resetForm = () => setForm({ title: "", description: "", grade: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    try {
      await createPosition({
        ...form,
        organizationId: "1",
        description: form.description || undefined,
        grade: form.grade || undefined,
      });
      resetForm();
      setShowCreate(false);
    } catch { /* handled */ }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPosition || !form.title) return;
    try {
      await updatePosition({
        positionId: editPosition.positionId,
        title: form.title,
        description: form.description || undefined,
        grade: form.grade || undefined,
      });
      resetForm();
      setEditPosition(null);
    } catch { /* handled */ }
  };

  const handleDelete = async () => {
    if (!deletePosition) return;
    try {
      await removePosition(deletePosition.positionId);
      setDeletePosition(null);
    } catch { /* handled */ }
  };

  const openEdit = (pos: Position) => {
    setForm({
      title: pos.title,
      description: pos.description || "",
      grade: pos.grade || "",
    });
    setEditPosition(pos);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const PositionForm = ({
    onSubmit,
    submitLabel,
    isLoading,
    onCancel,
  }: {
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    isLoading: boolean;
    onCancel: () => void;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          placeholder="e.g. Software Engineer, HR Manager"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Grade</Label>
        <Input
          placeholder="e.g. L3, Senior, Band 7"
          value={form.grade}
          onChange={(e) => setForm({ ...form, grade: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Describe the position..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !form.title}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );

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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Positions
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage job positions and assign competencies
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Position
        </Button>
      </div>

      {!positions.length ? (
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No positions yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            Create your first job position to start assigning competencies.
          </p>
          <Button onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Create Position
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Grade</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((pos) => (
                <TableRow
                  key={pos.positionId}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                  onClick={() => router.push(`/dashboard/positions/${pos.positionId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {pos.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pos.grade ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {pos.grade}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {pos.description || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(pos.createdAt)}</TableCell>
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
                            router.push(`/dashboard/positions/${pos.positionId}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View & Assign Competencies
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(pos);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletePosition(pos);
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
      )}

      {/* Create Position Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Position</DialogTitle>
            <DialogDescription>Add a new job position to the organization.</DialogDescription>
          </DialogHeader>
          <PositionForm
            onSubmit={handleCreate}
            submitLabel="Create Position"
            isLoading={mutLoading.create}
            onCancel={() => { resetForm(); setShowCreate(false); }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Position Dialog */}
      <Dialog open={!!editPosition} onOpenChange={(open) => { if (!open) { resetForm(); setEditPosition(null); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Position</DialogTitle>
            <DialogDescription>Update position details.</DialogDescription>
          </DialogHeader>
          <PositionForm
            onSubmit={handleEdit}
            submitLabel="Save Changes"
            isLoading={mutLoading.update}
            onCancel={() => { resetForm(); setEditPosition(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Position Dialog */}
      <AlertDialog open={!!deletePosition} onOpenChange={(open) => !open && setDeletePosition(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{deletePosition?.title}&quot;</strong>?
              All competency assignments linked to this position will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={mutLoading.remove}>
              {mutLoading.remove && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
