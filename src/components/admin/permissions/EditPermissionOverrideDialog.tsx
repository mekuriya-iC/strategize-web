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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Shield, UserCheck, UserX, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePermissionMutations } from "@/hooks/permissions/usePermissionManagement";

interface EditPermissionOverrideDialogProps {
  override: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditPermissionOverrideDialog({
  override,
  open,
  onOpenChange,
  onSuccess,
}: EditPermissionOverrideDialogProps) {
  const [isActive, setIsActive] = useState(true);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updatePermissionOverride } = usePermissionMutations();

  // Initialize form with override data
  useEffect(() => {
    if (override) {
      setIsActive(override.isActive);
      setReason(override.reason || "");
    }
  }, [override]);

  const handleSubmit = async () => {
    if (!override || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      await updatePermissionOverride(
        override.userPermissionOverrideId,
        isActive,
        reason.trim()
      );
      
      onSuccess();
    } catch (error) {
      console.error("Failed to update permission override:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!override) return null;

  const now = new Date();
  const isExpired = override.expiresAt && new Date(override.expiresAt) < now;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Edit Permission Override
          </DialogTitle>
          <DialogDescription>
            Update the status and reason for this permission override
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Override Details */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Override Details
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>User:</strong> {override.user.fullName}</p>
              <p><strong>Email:</strong> {override.user.email}</p>
              <p><strong>Permission:</strong> {override.permission.label}</p>
              <p><strong>Code:</strong> <code>{override.permission.code}</code></p>
              <div className="flex items-center gap-2">
                <strong>Type:</strong>
                {override.isGranted ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <UserCheck className="w-3 h-3" />
                    Granted
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <UserX className="w-3 h-3" />
                    Denied
                  </span>
                )}
              </div>
              <p><strong>Created:</strong> {new Date(override.createdAt).toLocaleDateString()}</p>
              {override.expiresAt && (
                <p><strong>Expires:</strong> {new Date(override.expiresAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Expiration Warning */}
          {isExpired && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Override Expired
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                    This permission override has expired and is no longer in effect.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-3">
            <Label>Override Status</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(!!checked)}
                disabled={isExpired}
              />
              <Label htmlFor="active" className="text-sm">
                Override is active
              </Label>
            </div>
            {!isActive && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Disabling this override will remove its effect on the user's permissions.
              </p>
            )}
            {isExpired && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Cannot modify status of expired overrides.
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Update Reason (Required)</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for updating this override..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Provide a reason for this update. This will be logged for audit purposes.
            </p>
          </div>

          {/* Original Reason */}
          {override.reason && (
            <div className="space-y-2">
              <Label>Original Reason</Label>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                {override.reason}
              </div>
            </div>
          )}

          {/* Update Summary */}
          {reason.trim() && (
            <div className={`border rounded-lg p-3 ${
              isActive 
                ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
            }`}>
              <h4 className={`text-sm font-medium mb-2 ${
                isActive 
                  ? "text-blue-800 dark:text-blue-300"
                  : "text-gray-800 dark:text-gray-300"
              }`}>
                Update Summary
              </h4>
              <div className={`text-sm space-y-1 ${
                isActive 
                  ? "text-blue-700 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-400"
              }`}>
                <p><strong>Status:</strong> {isActive ? "Active" : "Disabled"}</p>
                <p><strong>Update Reason:</strong> {reason}</p>
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
            disabled={!reason.trim() || isSubmitting}
            className="bg-[#3838EC] hover:bg-[#2828DC]"
          >
            {isSubmitting ? "Updating..." : "Update Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}