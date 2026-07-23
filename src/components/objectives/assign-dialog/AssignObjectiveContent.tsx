"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Building2, Users, CheckCircle } from "lucide-react";
import { AssigneeTab } from "./AssigneeTab";
import { KPISelectionCard } from "./KPISelectionCard";
import { TargetAssignmentCard } from "./TargetAssignmentCard";
import { AssignmentListCard } from "./AssignmentListCard";
import {
    useAssignmentContext,
    type AssigneeType,
} from "@/context/AssignmentContext";
import { useAssignmentActions } from "@/hooks/objectives/useAssignmentActions";

export function AssignObjectiveContent({ onSuccess, onClose }: { onSuccess?: () => void; onClose: () => void }) {
    const {
        sourceObjective: objective,
        assigneeType,
        setAssigneeType,
        availableKPIs,
        assignments,
        removeAssignment
    } = useAssignmentContext();

    const { handleSubmit, isSubmitting } = useAssignmentActions({ onSuccess, onClose });

    // Determine the effective cascading level:
    // - For cascaded objectives (assigned from above), use assigneeType to determine what level we're at
    // - A CORPORATE objective assigned to a DIVISION should cascade to DEPARTMENT/PERSONNEL (not DIVISION again)
    // - Falls back to objective.type for top-level objectives
    const effectiveLevel = React.useMemo(() => {
        if (!objective) return "CORPORATE";
        // If this objective was assigned to a specific type, that's the current level
        if (objective.assigneeType === "DIVISION") return "DIVISION";
        if (objective.assigneeType === "DEPARTMENT") return "DEPARTMENT";
        if (objective.assigneeType === "EMPLOYEE") return "PERSONNEL";
        // Fall back to objective type
        return objective.type || "CORPORATE";
    }, [objective]);

    // Compute tabs count for grid layout
    const getTabCount = () => {
        let count = 0;
        if (effectiveLevel === "CORPORATE") count += 2; // Division + Dept
        if (effectiveLevel === "DIVISION") count += 2; // Dept + Personnel
        if (effectiveLevel === "DEPARTMENT") count += 1; // Personnel
        return count || 1;
    };



    return (
        <div className="space-y-6">
            {/* Smart Assignment Info */}
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-green-800 text-sm">
                    <strong>Smart Assignment:</strong> The system prevents duplicate objectives.
                </div>
            </div>

            <Tabs
                value={assigneeType}
                onValueChange={(value) => setAssigneeType(value as AssigneeType)}
            >
                <TabsList className={`grid w-full grid-cols-${getTabCount()}`}>
                    {effectiveLevel === "CORPORATE" && (
                        <TabsTrigger value="DIVISION" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Division
                        </TabsTrigger>
                    )}
                    {(effectiveLevel === "CORPORATE" || effectiveLevel === "DIVISION") && (
                        <TabsTrigger value="DEPARTMENT" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Department
                        </TabsTrigger>
                    )}
                    {(effectiveLevel === "DIVISION" || effectiveLevel === "DEPARTMENT") && (
                        <TabsTrigger value="PERSONNEL" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Employee
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="DIVISION">
                    <AssigneeTab type="DIVISION" />
                </TabsContent>
                <TabsContent value="DEPARTMENT">
                    <AssigneeTab type="DEPARTMENT" />
                </TabsContent>
                <TabsContent value="PERSONNEL">
                    <AssigneeTab type="PERSONNEL" />
                </TabsContent>
            </Tabs>

            <Separator />

            <AddToAssignmentButton />

            <Separator />

            <KPISelectionCard />

            <TargetAssignmentCard />

            <AssignmentListCard
                assignments={assignments}
                kpis={availableKPIs}
                onRemoveAssignment={removeAssignment}
            />

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={assignments.length === 0 || isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                    {isSubmitting ? "Assigning..." : "Submit Assignments"}
                </Button>
            </div>
        </div>
    );
}

// Sub-component to handle the "Add to List" logic which requires data access
function AddToAssignmentButton() {
    const {
        selectedAssignees,
        selectedKPIs,
        addAssignment,
        clearSelectedAssignees,
    } = useAssignmentContext();

    const handleAdd = () => {
        selectedAssignees.forEach(assignee => {
            addAssignment({
                assigneeId: assignee.id,
                assigneeType: assignee.type,
                assigneeName: assignee.name,
                kpis: selectedKPIs
            });
        });
        clearSelectedAssignees();
    };

    if (selectedAssignees.length === 0 || selectedKPIs.length === 0) return null;

    return (
        <div className="space-y-2 text-center">
            <Button
                onClick={handleAdd}
                className="bg-green-600 hover:bg-green-700 text-white"
            >
                Add {selectedAssignees.length} to Assignment List
            </Button>
        </div>
    );
}
