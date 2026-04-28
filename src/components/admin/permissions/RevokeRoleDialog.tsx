"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, UserX } from "lucide-react";
import { usePermissionMutations } from "@/hooks/permissions/usePermissionManagement";

interface RevokeRoleDialogProps {
  assignment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function RevokeRoleDialog({
  assignment,
  open,
  onOpenChange,
  onSuccess,
}: RevokeRoleDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { revokeRoleFromUser } = usePermissionMutations();

  const handleSubmit = async () => {
    if (!assignment) return;

    setIsSubmitting(true);
    try {
      await revokeRoleFromUser(assignment.userRoleAssignmentId, reason || undefined);
      
      // Reset form
      setReason("");
      
      onSuccess();
    } catch (error) {
      console.error("Failed to revoke role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <UserX className="w-5 h-5" />
            Revoke Role Assignment
          </DialogTitle>
          <DialogDescription>
            This action will revoke the role assignment. The user will lose all permissions associated with this role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Warning: This action cannot be undone
                </h4>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  The user will immediately lose access to all features and data protected by this role.
                </p>
              </div>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Assignment Details
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>User:</strong> {assignment.user.fullName}</p>
              <p><strong>Email:</strong> {assignment.user.email}</p>
              <p><strong>Role:</strong> {assignment.role.name}</p>
              <p><strong>Type:</strong> {assignment.isPrimary ? "Primary Role" : "Additional Role"}</p>
              <p><strong>Assigned:</strong> {new Date(assignment.createdAt).toLocaleDateString()}</p>
              {assignment.expiresAt && (
                <p><strong>Expires:</strong> {new Date(assignment.expiresAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Revocation (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for revoking this role assignment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This reason will be logged for audit purposes.
            </p>
          </div>
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
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Revoking..." : "Revoke Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}