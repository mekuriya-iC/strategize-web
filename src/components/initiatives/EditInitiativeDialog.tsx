"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useInitiativeMutations, type Initiative } from "@/hooks/initiatives/useInitiatives";
import { Loader2 } from "lucide-react";

interface EditInitiativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiative: Initiative | null;
}

export default function EditInitiativeDialog({
  open,
  onOpenChange,
  initiative,
}: EditInitiativeDialogProps) {
  const { updateInitiative, loading } = useInitiativeMutations();

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    dueDate: "",
    status: "DRAFT",
    completionPercentage: 0,
  });

  useEffect(() => {
    if (initiative) {
      setForm({
        title: initiative.title || "",
        description: initiative.description || "",
        startDate: initiative.startDate?.split("T")[0] || "",
        dueDate: initiative.dueDate?.split("T")[0] || "",
        status: initiative.status || "DRAFT",
        completionPercentage: initiative.completionPercentage || 0,
      });
    }
  }, [initiative]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initiative || !form.title) return;

    try {
      await updateInitiative({
        initiativeId: initiative.initiativeId,
        title: form.title,
        description: form.description || undefined,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
        status: form.status,
        completionPercentage: form.completionPercentage,
      });
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Initiative</DialogTitle>
          <DialogDescription>
            Update initiative details and progress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-init-title">Title *</Label>
            <Input
              id="edit-init-title"
              placeholder="Enter initiative title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-init-desc">Description</Label>
            <Textarea
              id="edit-init-desc"
              placeholder="Describe the initiative..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-init-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(val) => setForm({ ...form, status: val })}
            >
              <SelectTrigger id="edit-init-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Completion: {form.completionPercentage}%</Label>
            <Slider
              value={[form.completionPercentage]}
              onValueChange={(val: number[]) => setForm({ ...form, completionPercentage: val[0] })}
              max={100}
              step={5}
              className="py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-init-start">Start Date</Label>
              <Input
                id="edit-init-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-init-due">Due Date</Label>
              <Input
                id="edit-init-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading.update || !form.title}>
              {loading.update && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
