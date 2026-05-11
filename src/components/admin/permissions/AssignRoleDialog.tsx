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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePermissionMutations } from "@/hooks/permissions/usePermissionManagement";

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: any[];
  roles: any[];
  onSuccess: () => void;
}

export default function AssignRoleDialog({
  open,
  onOpenChange,
  employees,
  roles,
  onSuccess,
}: AssignRoleDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { assignRoleToUser } = usePermissionMutations();

  // Debug logging
  console.log('🔐 [AssignRoleDialog] Props received:', {
    employeesCount: employees?.length || 0,
    rolesCount: roles?.length || 0,
    employees: employees?.map(e => ({ id: e.employeeId, name: e.fullName })),
    roles: roles?.map(r => ({ id: r.roleId, name: r.name }))
  });

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedRoleId) return;

    setIsSubmitting(true);
    try {
      await assignRoleToUser(
        selectedUserId,
        selectedRoleId,
        isPrimary,
        hasExpiration && expirationDate ? expirationDate.toISOString() : undefined
      );
      
      // Reset form
      setSelectedUserId("");
      setSelectedRoleId("");
      setIsPrimary(false);
      setHasExpiration(false);
      setExpirationDate(undefined);
      
      onSuccess();
    } catch (error) {
      console.error("Failed to assign role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(emp => emp.employeeId === selectedUserId);
  const selectedRole = roles.find(role => role.roleId === selectedRoleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign Role to User
          </DialogTitle>
          <DialogDescription>
            Assign a role to a user with optional expiration date
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show warning if no roles available */}
          {roles.length === 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                No Roles Available
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                No roles have been created yet. Please create roles in the Roles Management section before assigning them to users.
              </p>
            </div>
          )}

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.employeeId} value={employee.employeeId}>
                    <div className="flex flex-col">
                      <span className="font-medium">{employee.fullName}</span>
                      <span className="text-xs text-gray-500">{employee.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Select Role</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role..." />
              </SelectTrigger>
              <SelectContent>
                {roles.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-gray-500 text-center">
                    No roles available
                  </div>
                ) : (
                  roles.map((role) => (
                    <SelectItem key={role.roleId} value={role.roleId}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-gray-500">{role.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Role Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(!!checked)}
            />
            <Label htmlFor="primary" className="text-sm">
              Set as primary role for this user
            </Label>
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

          {/* Assignment Summary */}
          {selectedEmployee && selectedRole && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Assignment Summary
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <p><strong>User:</strong> {selectedEmployee.fullName}</p>
                <p><strong>Role:</strong> {selectedRole.name}</p>
                <p><strong>Type:</strong> {isPrimary ? "Primary Role" : "Additional Role"}</p>
                <p><strong>Expires:</strong> {hasExpiration && expirationDate ? format(expirationDate, "PPP") : "Never"}</p>
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
            disabled={!selectedUserId || !selectedRoleId || isSubmitting}
            className="bg-[#3838EC] hover:bg-[#2828DC]"
          >
            {isSubmitting ? "Assigning..." : "Assign Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}