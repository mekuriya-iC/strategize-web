import React, { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MoreHorizontal, Users, ShieldAlert, Send } from "lucide-react";
import DeleteKpiDialog from "@/components/objectives/DeleteKpiDialog";
import AssignKPIDialog from "@/components/objectives/AssignKPIDialog";
import SubmitDialog from "@/components/submissions/SubmitDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Kpi } from "@/types/graphql";
import { useAuthStore } from "@/stores";
import usePermissions from "@/hooks/permissions/usePermissions";

interface KPIActionsProps {
    kpi: Kpi;
    allKpis: Kpi[]; // Added to track assignment
    onEdit: (id: string) => void;
    onRefresh: () => void;
    currentObjectiveType?: string; // Fallback for objective type
}

const KPIActions: React.FC<KPIActionsProps> = ({ kpi, allKpis, onEdit, onRefresh, currentObjectiveType }) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showAssignDialog, setShowAssignDialog] = useState(false);

    const { role } = usePermissions();
    const user = useAuthStore((state) => state.user);

    const isKpiApproved = kpi.status === "APPROVED";
    const isObjectiveApproved = kpi.objective?.status === "APPROVED";

    const isAssigned = React.useMemo(() => {
        return allKpis.some(other => other.parent?.kpiId === kpi.kpiId);
    }, [allKpis, kpi.kpiId]);

    // Rule 1 & 2: Assignment requirements
    const canAssign = isKpiApproved && isObjectiveApproved && !isAssigned;

    const isCorporate = kpi.objective?.type === "CORPORATE";

    // Rule 2 & 4: Read-only and Cascaded rules
    // Corporate objectives/KPIs are never read-only even if approved
    const isReadOnly = isObjectiveApproved && !isCorporate;

    const isCascaded = React.useMemo(() => {
        if (!role) return false;
        const roleOrder: Record<string, number> = {
            'SUPER_ADMIN': 4,
            'ADMIN': 4,
            'DIRECTOR': 3,
            'MANAGER': 2,
            'NORMAL': 1
        };
        const typeOrder: Record<string, number> = {
            'CORPORATE': 4,
            'DIVISION': 3,
            'DEPARTMENT': 2,
            'PERSONNEL': 1
        };
        const userLevel = roleOrder[role as string] || 0;
        const objectiveLevel = typeOrder[kpi.objective?.type as string] || 0;
        return userLevel > objectiveLevel;
    }, [role, kpi.objective?.type]);

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
                    {(!isReadOnly && !isCascaded) ? (
                        <DropdownMenuItem
                            onClick={() => onEdit(kpi.kpiId)}
                            className="cursor-pointer"
                        >
                            <Edit className="mr-2 h-4 w-4 text-blue-500" />
                            <span>Edit KPI</span>
                        </DropdownMenuItem>
                    ) : (
                        <div className="px-2 py-1.5 text-xs text-gray-400 italic">
                            {isReadOnly ? "Read-only (Approved)" : "Edit disabled (Cascaded)"}
                        </div>
                    )}

                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-full">
                                    <DropdownMenuItem
                                        onClick={() => canAssign && setShowAssignDialog(true)}
                                        disabled={!canAssign}
                                        className={`cursor-pointer ${!canAssign ? "opacity-50 grayscale" : ""}`}
                                    >
                                        <Users className={`mr-2 h-4 w-4 ${canAssign ? "text-purple-500" : "text-gray-400"}`} />
                                        <span>Assign KPI</span>
                                        {!canAssign && <ShieldAlert className="ml-auto h-3 w-3 text-amber-500" />}
                                    </DropdownMenuItem>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-amber-50 text-amber-800 border-amber-200 p-3 max-w-[200px]">
                                {isAssigned ? (
                                    <p className="font-semibold text-purple-700">Already Assigned.</p>
                                ) : (
                                    <>
                                        <p className="font-semibold">Workflow incomplete:</p>
                                        <p className="text-xs mt-1">
                                            • KPI: {kpi.status ? kpi.status.replace("_", " ") : "Unknown"} {isKpiApproved ? "✓" : "×"}
                                        </p>
                                        <p className="text-xs">
                                            • Objective: {kpi.objective?.status ? kpi.objective.status.replace("_", " ") : "N/A"} {isObjectiveApproved ? "✓" : "×"}
                                        </p>
                                        <p className="text-[10px] mt-2 italic">Both must be APPROVED to assign.</p>
                                    </>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Submit for Approval Rule: Only if not already approved or pending */}
                    {kpi.status !== "APPROVED" && kpi.status !== "PENDING" && (
                        <SubmitDialog
                            itemId={kpi.kpiId}
                            itemName={kpi.name}
                            objectiveType={(kpi.objective?.type || currentObjectiveType || "DEPARTMENT") as any}
                            itemType="kpi"
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
                    {(!isReadOnly || role === "ADMIN" || role === "SUPER_ADMIN") ? (
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

            <AssignKPIDialog
                open={showAssignDialog}
                onOpenChange={setShowAssignDialog}
                kpi={kpi}
                onSuccess={onRefresh}
            />
        </>
    );
};

export default KPIActions;
