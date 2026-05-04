"use client";

import { useState } from "react";
import { getOrganizationId } from "@/lib/constants/organization";
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
import { Plus } from "lucide-react";
import { usePermissionMutations, useRoles } from "@/hooks/permissions/usePermissionManagement";

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateRoleDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateRoleDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [parentRoleId, setParentRoleId] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createRole } = usePermissionMutations();
  const { roles } = useRoles(1, 100); // Get all roles for parent selection

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      await createRole({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        parentRoleId: parentRoleId && parentRoleId !== "none" ? parentRoleId : undefined,
        organizationId: getOrganizationId(),
      });
      
      // Reset form
      setName("");
      setCode("");
      setDescription("");
      setParentRoleId("none");
      
      onSuccess();
    } catch (error) {
      console.error("Failed to create role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate code from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!code) {
      const generatedCode = value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      setCode(generatedCode);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Role
          </DialogTitle>
          <DialogDescription>
            Create a new role with specific permissions for users in your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Department Manager"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          {/* Role Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Role Code *</Label>
            <Input
              id="code"
              placeholder="e.g., DEPT_MANAGER"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Unique identifier for this role. Auto-generated from name but can be customized.
            </p>
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
                  .filter((role: any) => !role.isDeleted)
                  .map((role: any) => (
                    <SelectItem key={role.roleId} value={role.roleId}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.name}</span>
                        <span className="text-xs text-gray-500">{role.code}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If selected, this role will inherit all permissions from the parent role.
            </p>
          </div>

          {/* Preview */}
          {name && code && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Role Preview
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Code:</strong> {code}</p>
                {description && <p><strong>Description:</strong> {description}</p>}
                {parentRoleId && parentRoleId !== "none" && (
                  <p><strong>Parent:</strong> {roles.find((r: any) => r.roleId === parentRoleId)?.name}</p>
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
            disabled={!name.trim() || !code.trim() || isSubmitting}
            className="bg-[#3838EC] hover:bg-[#2828DC]"
          >
            {isSubmitting ? "Creating..." : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}