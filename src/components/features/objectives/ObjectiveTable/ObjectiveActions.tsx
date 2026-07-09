import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Plus,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Objective, Kpi } from "@/types/graphql";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import usePermissions from "@/hooks/permissions/usePermissions";
import { useAuthStore } from "@/stores";
import EditObjectiveDialog from "@/components/objectives/EditObjectiveDialog";
import DeleteObjectiveDialog from "@/components/objectives/DeleteObjectiveDialog";
import AddKPIDialog from "@/components/objectives/AddKPIDialog";
import ObjectiveWithKPIsSubmitDialog from "@/components/submissions/ObjectiveWithKPIsSubmitDialog";
import ChangeObjectiveStatusDialog from "@/components/objectives/ChangeObjectiveStatusDialog";

interface ObjectiveActionsProps {
  objective: Objective;
  kpis: Kpi[];
  onView: (objective: Objective) => void;
  onEditSuccess?: () => void;
  onDelete?: (objective: Objective) => void;
  onAddKPISuccess?: () => void;
}

const ObjectiveActions: React.FC<ObjectiveActionsProps> = ({
  objective,
  kpis,
  onView,
  onEditSuccess,
  onDelete,
  onAddKPISuccess,
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddKPIDialog, setShowAddKPIDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const { role, scope } = usePermissions();
  const currentUser = useAuthStore((state) => state.user);

  const isApproved =
    objective.status === "APPROVED" ||
    (objective as any).cascadeStatus === "approved" ||
    Boolean((objective as any).approvedAt);
  const canSubmit =
    objective.status === "NOT_SUBMITTED" || objective.status === "REJECTED";
  const isReadOnly = isApproved; // Rule 2: Objective becomes read-only after approval

  // Assignees (division/dept managers) may edit titles on objectives assigned to their unit
  const isAssignedToCurrentUser = React.useMemo(() => {
    if (!objective.assigneeId) return false;

    const assigneeType = objective.assigneeType?.toUpperCase();

    if (assigneeType === "PERSONNEL" || !assigneeType) {
      return objective.assigneeId === currentUser?.employeeId;
    }

    if (!scope) return false;

    if (assigneeType === "DIVISION") {
      return (
        scope.managedDivisionIds.includes(objective.assigneeId) ||
        scope.divisionIds.includes(objective.assigneeId)
      );
    }

    if (assigneeType === "DEPARTMENT") {
      return (
        scope.managedDepartmentIds.includes(objective.assigneeId) ||
        scope.departmentIds.includes(objective.assigneeId)
      );
    }

    return false;
  }, [
    currentUser?.employeeId,
    objective.assigneeId,
    objective.assigneeType,
    scope,
  ]);

  // Higher-level users viewing lower-level objectives they cascaded: no edit (unless assignee)
  const isCascaded = React.useMemo(() => {
    if (!role || isAssignedToCurrentUser) return false;

    const roleOrder: Record<string, number> = {
      SUPER_ADMIN: 4,
      ADMIN: 4,
      DIRECTOR: 3,
      MANAGER: 2,
      NORMAL: 1,
    };

    const typeOrder: Record<string, number> = {
      CORPORATE: 4,
      DIVISION: 3,
      DEPARTMENT: 2,
      PERSONNEL: 1,
    };

    const userLevel = roleOrder[role as string] || 0;
    const objectiveLevel = typeOrder[objective.type as string] || 0;

    return userLevel > objectiveLevel;
  }, [role, objective.type, isAssignedToCurrentUser]);

  const objectiveKPIs = kpis.filter(
    (k) => k.objective?.objectiveId === objective.objectiveId,
  );
  const hasApprovedKpi = objectiveKPIs.some((kpi) => kpi.status === "APPROVED");
  const isCascadedObjective = Boolean(objective.parent?.objectiveId);
  const deleteDisabledReason = isReadOnly
    ? "Delete disabled (Approved)"
    : hasApprovedKpi
      ? "Delete disabled (Approved KPI inside)"
      : isCascadedObjective
        ? "Delete disabled (Cascaded from parent)"
        : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
            <MoreVertical className="h-4 w-4 text-gray-400" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => onView(objective)}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4 text-blue-500" />
            <span>View Details</span>
          </DropdownMenuItem>

          {!isReadOnly ? (
            <DropdownMenuItem
              onClick={() => setShowAddKPIDialog(true)}
              className="cursor-pointer text-green-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Add KPI</span>
            </DropdownMenuItem>
          ) : (
            <div className="px-2 py-1.5 text-xs text-gray-400 italic">
              Adding KPIs disabled (Approved)
            </div>
          )}

          {canSubmit && (
            <DropdownMenuItem
              onClick={() => setShowSubmitDialog(true)}
              className="cursor-pointer text-blue-600"
            >
              <Send className="mr-2 h-4 w-4" />
              <span>Submit for Approval</span>
            </DropdownMenuItem>
          )}

          {/* Status Change - Only for ADMIN/SUPER_ADMIN */}
          {(role === "ADMIN" || role === "SUPER_ADMIN") && (
            <DropdownMenuItem
              onClick={() => setShowStatusDialog(true)}
              className="cursor-pointer text-purple-600"
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              <span>Change Status</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {!isReadOnly ? (
            !isCascaded ? (
              <DropdownMenuItem
                onClick={() => setShowEditDialog(true)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4 text-blue-500" />
                <span>Edit Objective</span>
              </DropdownMenuItem>
            ) : (
              <div className="px-2 py-1.5 text-xs text-gray-400 italic">
                Edit disabled for cascaded objective
              </div>
            )
          ) : (
            <div className="px-2 py-1.5 text-xs text-gray-400 italic">
              Edit disabled (Approved)
            </div>
          )}

          {!deleteDisabledReason ? (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Objective</span>
            </DropdownMenuItem>
          ) : (
            <div className="px-2 py-1.5 text-xs text-red-400 italic">
              {deleteDisabledReason}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditObjectiveDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        objective={objective}
        onEditSuccess={onEditSuccess}
      />

      <DeleteObjectiveDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        objectiveId={objective.objectiveId}
        objectiveName={objective.title || objective.name || "Unnamed Objective"}
        onDeleteSuccess={() => onDelete?.(objective)}
      />

      <AddKPIDialog
        open={showAddKPIDialog}
        onOpenChange={setShowAddKPIDialog}
        objective={objective}
        onSuccess={onAddKPISuccess}
        renderTrigger={false}
      />

      <ObjectiveWithKPIsSubmitDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        objectiveId={objective.objectiveId}
        objectiveName={objective.title || objective.name || "Unnamed Objective"}
        objectiveType={objective.type}
        assigneeType={objective.assigneeType}
        parentId={objective.parent?.objectiveId}
        associatedKPIs={objectiveKPIs}
        onSubmitSuccess={onEditSuccess}
      />

      <ChangeObjectiveStatusDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        objectiveId={objective.objectiveId}
        objectiveName={objective.title || objective.name || "Unnamed Objective"}
        currentStatus={objective.status}
        onSuccess={onEditSuccess}
      />
    </>
  );
};

export default ObjectiveActions;
