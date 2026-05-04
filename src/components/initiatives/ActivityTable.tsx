"use client";

import { useState } from "react";
import { getOrganizationId } from "@/lib/constants/organization";
import { type Activity, useInitiativeMutations } from "@/hooks/initiatives/useInitiatives";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/stores";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Flag,
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
} from "lucide-react";

interface ActivityTableProps {
  activities: Activity[];
  initiativeId: string;
  loading: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
  NOT_DONE: <Circle className="h-4 w-4 text-gray-400" />,
  DONE: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  CANCELLED: <XCircle className="h-4 w-4 text-red-400" />,
  POSTPONED: <Clock className="h-4 w-4 text-amber-400" />,
};

const statusLabels: Record<string, string> = {
  NOT_DONE: "Not Done",
  DONE: "Done",
  CANCELLED: "Cancelled",
  POSTPONED: "Postponed",
};

export default function ActivityTable({ activities, initiativeId, loading }: ActivityTableProps) {
  const user = useAuthStore((state) => state.user);
  const { createActivity, updateActivity, removeActivity, loading: mutLoading } =
    useInitiativeMutations();

  const [showCreate, setShowCreate] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    dueDate: "",
    milestone: false,
    notes: "",
    status: "NOT_DONE",
  });

  const resetForm = () => {
    setForm({ title: "", description: "", startDate: "", dueDate: "", milestone: false, notes: "", status: "NOT_DONE" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    try {
      await createActivity({
        ...form,
        initiativeId,
        organizationId: getOrganizationId(),
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
      });
      resetForm();
      setShowCreate(false);
    } catch { /* handled */ }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editActivity || !form.title) return;
    try {
      await updateActivity({
        activityId: editActivity.activityId,
        initiativeId,
        ...form,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
      });
      resetForm();
      setEditActivity(null);
    } catch { /* handled */ }
  };

  const handleDelete = async () => {
    if (!deleteActivity) return;
    try {
      await removeActivity(deleteActivity.activityId, initiativeId);
      setDeleteActivity(null);
    } catch { /* handled */ }
  };

  const openEdit = (activity: Activity) => {
    setForm({
      title: activity.title,
      description: activity.description || "",
      startDate: activity.startDate?.split("T")[0] || "",
      dueDate: activity.dueDate?.split("T")[0] || "",
      milestone: activity.milestone,
      notes: activity.notes || "",
      status: activity.status,
    });
    setEditActivity(activity);
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const ActivityForm = ({ onSubmit, submitLabel, isLoading }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string; isLoading: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input placeholder="Activity title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea placeholder="Describe the activity..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NOT_DONE">Not Done</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
            <SelectItem value="POSTPONED">Postponed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="milestone" checked={form.milestone} onCheckedChange={(v) => setForm({ ...form, milestone: !!v })} />
        <Label htmlFor="milestone" className="text-sm cursor-pointer">Mark as milestone</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => { resetForm(); setShowCreate(false); setEditActivity(null); }}>Cancel</Button>
        <Button type="submit" disabled={isLoading || !form.title}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Activities ({activities.length})
        </h3>
        <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Activity
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />)}
        </div>
      ) : !activities.length ? (
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No activities yet. Add the first activity to start tracking progress.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                <TableHead className="font-semibold w-[40px]" />
                <TableHead className="font-semibold">Activity</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Assigned To</TableHead>
                <TableHead className="font-semibold">Timeline</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.activityId} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <TableCell className="text-center">
                    {activity.milestone ? (
                      <Flag className="h-4 w-4 text-purple-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">•</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{activity.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {statusIcons[activity.status]}
                      <span className="text-sm">{statusLabels[activity.status]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                    {activity.assignedTo?.fullName || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(activity.startDate)} — {formatDate(activity.dueDate)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(activity)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => setDeleteActivity(activity)}>
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

      {/* Create Activity Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>Add a new activity to this initiative.</DialogDescription>
          </DialogHeader>
          <ActivityForm onSubmit={handleCreate} submitLabel="Add Activity" isLoading={mutLoading.createActivity} />
        </DialogContent>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={!!editActivity} onOpenChange={(open) => { if (!open) { resetForm(); setEditActivity(null); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>Update activity details.</DialogDescription>
          </DialogHeader>
          <ActivityForm onSubmit={handleEdit} submitLabel="Save Changes" isLoading={mutLoading.updateActivity} />
        </DialogContent>
      </Dialog>

      {/* Delete Activity Dialog */}
      <AlertDialog open={!!deleteActivity} onOpenChange={(open) => !open && setDeleteActivity(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteActivity?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={mutLoading.removeActivity}>
              {mutLoading.removeActivity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
