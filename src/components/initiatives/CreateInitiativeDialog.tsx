"use client";

import { useState } from "react";
import { getOrganizationId } from "@/lib/constants/organization";
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
import { useInitiativeMutations } from "@/hooks/initiatives/useInitiatives";
import { useAuthStore } from "@/stores";
import { Loader2 } from "lucide-react";

interface CreateInitiativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives?: { objectiveId: string; title: string }[];
}

export default function CreateInitiativeDialog({
  open,
  onOpenChange,
  objectives = [],
}: CreateInitiativeDialogProps) {
  const user = useAuthStore((state) => state.user);
  const { createInitiative, loading } = useInitiativeMutations();

  const [form, setForm] = useState({
    title: "",
    description: "",
    strategicObjectiveId: "",
    startDate: "",
    dueDate: "",
    status: "DRAFT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.strategicObjectiveId) return;

    try {
      await createInitiative({
        ...form,
        organizationId: getOrganizationId(),
        ownerUserId: user?.employeeId,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
      });
      setForm({ title: "", description: "", strategicObjectiveId: "", startDate: "", dueDate: "", status: "DRAFT" });
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Initiative</DialogTitle>
          <DialogDescription>
            Add a new strategic initiative linked to an objective.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="init-title">Title *</Label>
            <Input
              id="init-title"
              placeholder="Enter initiative title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="init-desc">Description</Label>
            <Textarea
              id="init-desc"
              placeholder="Describe the initiative..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="init-objective">Linked Objective *</Label>
            <Select
              value={form.strategicObjectiveId}
              onValueChange={(val) => setForm({ ...form, strategicObjectiveId: val })}
            >
              <SelectTrigger id="init-objective">
                <SelectValue placeholder="Select an objective" />
              </SelectTrigger>
              <SelectContent>
                {objectives.map((obj) => (
                  <SelectItem key={obj.objectiveId} value={obj.objectiveId}>
                    {obj.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="init-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(val) => setForm({ ...form, status: val })}
            >
              <SelectTrigger id="init-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="init-start">Start Date</Label>
              <Input
                id="init-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="init-due">Due Date</Label>
              <Input
                id="init-due"
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
            <Button type="submit" disabled={loading.create || !form.title || !form.strategicObjectiveId}>
              {loading.create && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Initiative
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
