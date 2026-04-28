"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { usePermissionMutations, useRoles } from "@/hooks/permissions/usePermissionManagement";

interface EditRoleDialogProps {
  role: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditRoleDialog({
  role,
  open,
  onOpenChange,
  onSuccess,
}: EditRoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentRoleId, setParentRoleId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateRole } = usePermissionMutations();
  const { roles } = useRoles(1, 100); // Get all roles for parent selection

  // Initialize form with role data
  useEffect(() => {
    if (role) {
      setName(role.name || "");
      setDescription(role.description || "");
      setParentRoleId(role.parentRole?.roleId || "none");
    }
  }, [role]);

  const handleSubmit = async () => {
    if (!role || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateRole({
        roleId: role.roleId,
        name: name.trim(),
        description: description.trim() || undefined,
        parentRoleId: parentRoleId && parentRoleId !== "none" ? parentRoleId : undefined,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Role
          </DialogTitle>
          <DialogDescription>
            Update the role details. Note that the role code cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role Code (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="code">Role Code</Label>
            <Input
              id="code"
              value={role.code}
              disabled
              className="bg-gray-100 dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Role codes cannot be changed after creation.
            </p>
          </div>

          {/* Role Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Department Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this role is for and what permissions it should have..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Parent Role */}
          <div className="space-y-2">
            <Label htmlFor="parentRole">Parent Role (Optional)</Label>
            <Select value={parentRoleId} onValueChange={setParentRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a parent role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent role</SelectItem>
                {roles
                  .filter((r: any) => !r.isDeleted && r.roleId !== role.roleId) // Exclude self
                  .map((r: any) => (
                    <SelectItem key={r.roleId} value={r.roleId}>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-gray-500">{r.code}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If selected, this role will inherit all permissions from the parent role.
            </p>
          </div>

          {/* System Role Warning */}
          {!role.isCustom && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Note:</strong> This is a system role. Changes may affect core functionality.
              </p>
            </div>
          )}

          {/* Changes Summary */}
          {(name !== role.name || description !== (role.description || "") || parentRoleId !== (role.parentRole?.roleId || "")) && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Changes Summary
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                {name !== role.name && (
                  <p><strong>Name:</strong> {role.name} → {name}</p>
                )}
                {description !== (role.description || "") && (
                  <p><strong>Description:</strong> {role.description || "(none)"} → {description || "(none)"}</p>
                )}
                {(parentRoleId !== (role.parentRole?.roleId || "none")) && (
                  <p><strong>Parent:</strong> {role.parentRole?.name || "(none)"} → {
                    parentRoleId && parentRoleId !== "none" ? roles.find((r: any) => r.roleId === parentRoleId)?.name : "(none)"
                  }</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="bg-[#3838EC] hover:bg-[#2828DC]"
          >
            {isSubmitting ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}