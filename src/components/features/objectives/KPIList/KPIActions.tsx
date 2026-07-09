import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MoreHorizontal, Send, Eye, Users } from "lucide-react";
import DeleteKpiDialog from "@/components/objectives/DeleteKpiDialog";
import SubmitDialog from "@/components/submissions/SubmitDialog";
import SingleKpiAssignmentDialog from "@/components/kpis/SingleKpiAssignmentDialog";
import { Kpi } from "@/types/graphql";
import usePermissions from "@/hooks/permissions/usePermissions";
import { isTopLevelCorporateObjective } from "@/lib/objectives/kpiWeightScope";
import { isKpiSubmittable } from "@/lib/objectives/submissionLevel";

interface KPIActionsProps {
  kpi: Kpi;
  allKpis: Kpi[]; // Added to track assignment
  onEdit: (id: string) => void;
  onRefresh: () => void;
  currentObjectiveType?: string; // Fallback for objective type
}

const KPIActions: React.FC<KPIActionsProps> = ({
  kpi,
  allKpis,
  onEdit,
  onRefresh,
  currentObjectiveType,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const { role } = usePermissions();
  const isKpiApproved = kpi.status === "APPROVED";
  const isObjectiveApproved =
    kpi.objective?.status === "APPROVED" ||
    (kpi.objective as any)?.cascadeStatus === "approved" ||
    Boolean((kpi.objective as any)?.approvedAt);

  const isAssigned = React.useMemo(() => {
    return allKpis.some((other) => other.parent?.kpiId === kpi.kpiId);
  }, [allKpis, kpi.kpiId]);

  const objectiveContext = kpi.objective
    ? {
        ...kpi.objective,
        parentId: kpi.objective.parent?.objectiveId ?? null,
      }
    : null;

  const isCorporate = objectiveContext
    ? isTopLevelCorporateObjective(objectiveContext)
    : false;

  // Check if this is an unassigned KPI
  const isUnassignedKpi = !kpi.assigneeId;

  // CEO and SUPER_ADMIN can edit unassigned KPIs even if approved
  const isCEOOrSuperAdmin = role === "CEO" || role === "SUPER_ADMIN";
  const canCEOEdit = isCEOOrSuperAdmin && isUnassignedKpi;

  // Approved KPIs/objectives are locked, except for CEO/SUPER_ADMIN on unassigned KPIs
  const isReadOnly = (isKpiApproved || isObjectiveApproved) && !canCEOEdit;

  const isCascaded = React.useMemo(() => {
    if (!role) return false;
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
    const objectiveLevel = typeOrder[kpi.objective?.type as string] || 0;
    return userLevel > objectiveLevel;
  }, [role, kpi.objective?.type]);

  // Check if this KPI has been assigned (has children)
  const hasBeenAssigned = React.useMemo(() => {
    return allKpis.some((other) => other.parent?.kpiId === kpi.kpiId);
  }, [allKpis, kpi.kpiId]);

  // Determine if "Assign KPI" option should be shown
  const canAssignKpi = React.useMemo(() => {
    // Must be approved
    if (kpi.status !== "APPROVED") return false;

    // Must not be already assigned
    if (hasBeenAssigned) return false;

    // DIRECT mode KPIs cannot cascade (manager logs directly)
    const kpiMode = (kpi as any).kpiMode || "AGGREGATED";
    if (kpiMode === "DIRECT") return false;

    // Must be at a level that can cascade
    const objectiveType = kpi.objective?.type;
    if (!objectiveType) return false;

    // CORPORATE → DIVISION/DEPARTMENT, DIVISION → DEPARTMENT, DEPARTMENT → EMPLOYEE
    if (
      objectiveType === "CORPORATE" ||
      objectiveType === "DIVISION" ||
      objectiveType === "DEPARTMENT"
    ) {
      return true;
    }

    return false;
  }, [kpi, hasBeenAssigned, allKpis]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/kpis/${kpi.kpiId}`)}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4 text-gray-500" />
            <span>View KPI</span>
          </DropdownMenuItem>

          {/* Assign KPI - Show for approved, unassigned KPIs that can cascade */}
          {canAssignKpi && (
            <SingleKpiAssignmentDialog kpi={kpi} onSuccess={onRefresh} />
          )}

          {/* DEBUG: Show why Assign KPI is not available */}
          {!canAssignKpi && kpi.status === "APPROVED" && (
            <DropdownMenuItem
              disabled
              className="text-xs text-gray-400 italic px-2 py-1.5"
            >
              <Users className="mr-2 h-4 w-4 text-gray-400" />
              <span>
                Assign disabled:{" "}
                {hasBeenAssigned
                  ? "Already assigned"
                  : (kpi as any).kpiMode === "DIRECT"
                    ? "DIRECT mode"
                    : !kpi.objective?.type
                      ? "No obj type"
                      : `Type: ${kpi.objective?.type}`}
              </span>
            </DropdownMenuItem>
          )}

          {!isReadOnly && !isCascaded ? (
            <DropdownMenuItem
              onClick={() => onEdit(kpi.kpiId)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4 text-blue-500" />
              <span>Edit KPI</span>
            </DropdownMenuItem>
          ) : canCEOEdit && isCascaded ? (
            <DropdownMenuItem
              onClick={() => onEdit(kpi.kpiId)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4 text-blue-500" />
              <span>Edit KPI (CEO/Admin)</span>
            </DropdownMenuItem>
          ) : (
            <div className="px-2 py-1.5 text-xs text-gray-400 italic">
              {isReadOnly && !canCEOEdit ? "Read-only (Approved)" : "Edit disabled (Cascaded)"}
            </div>
          )}

          {/* Submit for Approval Rule: Only if not already approved or pending */}
          {isKpiSubmittable(kpi.status) && (
            <SubmitDialog
              itemId={kpi.kpiId}
              itemName={kpi.name}
              objectiveType={
                (kpi.objective?.type ||
                  currentObjectiveType ||
                  "PERSONNEL") as any
              }
              assigneeType={kpi.objective?.assigneeType}
              parentId={kpi.objective?.parent?.objectiveId}
              itemType="kpi"
              knownKpiStatus={kpi.status}
              onSubmitSuccess={onRefresh}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer text-blue-600"
              >
                <Send className="mr-2 h-4 w-4" />
                <span>Submit for Approval</span>
              </DropdownMenuItem>
            </SubmitDialog>
          )}

          <DropdownMenuSeparator />
          {!isReadOnly || canCEOEdit ? (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete KPI</span>
            </DropdownMenuItem>
          ) : (
            <div className="px-2 py-1.5 text-xs text-red-400 italic">
              Delete disabled (Approved)
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteKpiDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        kpiId={kpi.kpiId}
        kpiName={kpi.name}
        onDeleteSuccess={onRefresh}
      />
    </>
  );
};

export default KPIActions;
