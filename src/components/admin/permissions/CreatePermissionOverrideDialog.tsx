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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Shield, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePermissionMutations } from "@/hooks/permissions/usePermissionManagement";
import { parseGraphQLError } from "@/utils/errorParsing";
import { toast } from "sonner";

interface CreatePermissionOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: any[];
  permissions: any[];
  onSuccess: () => void;
}

export default function CreatePermissionOverrideDialog({
  open,
  onOpenChange,
  employees,
  permissions,
  onSuccess,
}: CreatePermissionOverrideDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");
  const [isGranted, setIsGranted] = useState(true);
  const [reason, setReason] = useState("");
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createPermissionOverride } = usePermissionMutations();

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedPermissionId || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      console.log('🔐 Creating permission override with:', {
        userId: selectedUserId,
        permissionId: selectedPermissionId,
        isGranted,
        reason: reason.trim(),
        expiresAt: hasExpiration && expirationDate ? expirationDate.toISOString() : undefined,
      });

      const result = await createPermissionOverride(
        selectedUserId,
        selectedPermissionId,
        isGranted,
        reason.trim(),
        hasExpiration && expirationDate ? expirationDate.toISOString() : undefined
      );

      console.log('✅ Permission override created:', result);

      // Reset form
      setSelectedUserId("");
      setSelectedPermissionId("");
      setIsGranted(true);
      setReason("");
      setHasExpiration(false);
      setExpirationDate(undefined);

      onSuccess();
    } catch (error) {
      console.error("❌ Failed to create permission override:", error);
      const { title, description } = parseGraphQLError(error, "permission override");
      toast.error(title, { description });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = employees.find((emp) => emp.employeeId === selectedUserId);
  const selectedPermission = permissions.find(
    (perm) => perm.permissionDefinitionId === selectedPermissionId
  );

  // Build SearchableSelect option lists
  const employeeOptions = employees.map((emp) => ({
    value: emp.employeeId,
    label: emp.fullName,
    description: emp.email,
  }));

  const permissionOptions = permissions.map((perm) => ({
    value: perm.permissionDefinitionId,
    label: perm.label,
    description: `${perm.module} • ${perm.action} • ${perm.scope}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Create Permission Override
          </DialogTitle>
          <DialogDescription>
            Grant or deny a specific permission to an individual user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label>Select User</Label>
            <SearchableSelect
              options={employeeOptions}
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Choose a user..."
              searchPlaceholder="Search by name or email..."
              clearable
            />
          </div>

          {/* Permission Selection */}
          <div className="space-y-2">
            <Label>Select Permission</Label>
            <SearchableSelect
              options={permissionOptions}
              value={selectedPermissionId}
              onValueChange={setSelectedPermissionId}
              placeholder="Choose a permission..."
              searchPlaceholder="Search by name, module or action..."
              clearable
            />
          </div>

          {/* Override Type */}
          <div className="space-y-3">
            <Label>Override Type</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="grant"
                  name="overrideType"
                  checked={isGranted}
                  onChange={() => setIsGranted(true)}
                  className="w-4 h-4 text-green-600"
                />
                <Label htmlFor="grant" className="flex items-center gap-2 text-sm cursor-pointer">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  Grant Permission
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="deny"
                  name="overrideType"
                  checked={!isGranted}
                  onChange={() => setIsGranted(false)}
                  className="w-4 h-4 text-red-600"
                />
                <Label htmlFor="deny" className="flex items-center gap-2 text-sm cursor-pointer">
                  <UserX className="w-4 h-4 text-red-600" />
                  Deny Permission
                </Label>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Required)</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for this permission override..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This reason will be logged for audit purposes and is required.
            </p>
          </div>

          {/* Expiration Settings */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="expiration"
                checked={hasExpiration}
                onCheckedChange={(checked) => setHasExpiration(!!checked)}
              />
              <Label htmlFor="expiration" className="text-sm">
                Set expiration date
              </Label>
            </div>

            {hasExpiration && (
              <div className="space-y-2">
                <Label>Expiration Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expirationDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expirationDate ? format(expirationDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expirationDate}
                      onSelect={setExpirationDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Override Summary */}
          {selectedEmployee && selectedPermission && reason.trim() && (
            <div
              className={`border rounded-lg p-3 ${
                isGranted
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              }`}
            >
              <h4
                className={`text-sm font-medium mb-2 ${
                  isGranted
                    ? "text-green-800 dark:text-green-300"
                    : "text-red-800 dark:text-red-300"
                }`}
              >
                Override Summary
              </h4>
              <div
                className={`text-sm space-y-1 ${
                  isGranted
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                <p><strong>User:</strong> {selectedEmployee.fullName}</p>
                <p><strong>Permission:</strong> {selectedPermission.label}</p>
                <p><strong>Action:</strong> {isGranted ? "Grant" : "Deny"} permission</p>
                <p>
                  <strong>Expires:</strong>{" "}
                  {hasExpiration && expirationDate ? format(expirationDate, "PPP") : "Never"}
                </p>
                <p><strong>Reason:</strong> {reason}</p>
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
            disabled={
              !selectedUserId || !selectedPermissionId || !reason.trim() || isSubmitting
            }
            className={isGranted ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {isSubmitting ? "Creating..." : `${isGranted ? "Grant" : "Deny"} Permission`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
