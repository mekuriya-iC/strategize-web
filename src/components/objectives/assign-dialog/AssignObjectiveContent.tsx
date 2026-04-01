"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Building2, Users, CheckCircle, AlertCircle } from "lucide-react";
import { AssigneeTab } from "./AssigneeTab";
import { KPISelectionCard } from "./KPISelectionCard";
import { TargetAssignmentCard } from "./TargetAssignmentCard";
import { AssignmentListCard } from "./AssignmentListCard";
import { AssignmentPreviewCard } from "./AssignmentPreviewCard";
import { useAssignmentContext } from "@/context/AssignmentContext";
import { useAssignmentActions } from "@/hooks/objectives/useAssignmentActions";
import { useAssignmentData } from "@/hooks/objectives/useAssignmentData";

export function AssignObjectiveContent({ onSuccess, onClose }: { onSuccess?: () => void; onClose: () => void }) {
    const {
        sourceObjective: objective,
        assigneeType,
        setAssigneeType,
        selectedAssignees,
        selectedKPIs,
        availableKPIs,
        assignments,
        addAssignment,
        removeAssignment
    } = useAssignmentContext();

    const { handleSubmit, isSubmitting } = useAssignmentActions({ onSuccess, onClose });

    // Compute tabs count for grid layout
    const getTabCount = () => {
        let count = 0;
        if (objective?.type === "CORPORATE") count += 2; // Division + Dept
        if (objective?.type === "DIVISION") count += 1; // Dept
        if (objective?.type === "DEPARTMENT") count += 1; // Personnel
        return count || 1;
    };

    // Add to assignment list handler
    const handleAddToAssignments = () => {
        selectedAssignees.forEach(assigneeId => {
            // We need name here. In context refactor, we stored ID only.
            // We assume the hook `useAssignmentData` has the data. 
            // However, getting the name strictly from ID without looking up the list is hard.
            // Ideally, `toggleAssignee` should store object, or we look it up here.
            // Simplification: We will just push IDs, and let visual components lookup names.
            // BUT `assignments` in context expects `assigneeName`.
            // Let's rely on looking up via `useAssignmentData` cache or passed items? 
            // Actually `AssigneeTab` has the items. 
            // BETTER: `toggleAssignee` in context could accept `{ id, name, type }`?
            // For now, let's fix this in a follow-up if needed, but assuming we can look it up or passed name.
            // Wait, `selectedAssignees` is just string[].
            // Let's modify usage in `AssigneeTab` to simple toggle. 

            // Real fix: We need the name to store in `assignments`.
            // Since we don't have easy access to the list here (it's inside useAssignmentData which fetches based on type),
            // We can change `selectedAssignees` to store objects or fetch data here.
            // Let's assume we can fetch data here? No, that causes waterfall.
            // Let's compromise: The User sees "selectedAssignees" in the tab.
            // When they click "Add", we iterate and find names?
            // Or simpler: change context `toggleAssignee` to take `name`.
        });

        // Actually, let's look at `useAssignmentContext`. `addAssignment` takes `Assignment` object.
        // We need to construct it.
        // We can't easily construct it here without the list of items.

        // ALERT: Structural Gap.
        // `AssigneeTab` has the data.
        // We should probably move "Add to List" button INSIDE `AssigneeTab`? 
        // OR have `AssigneeTab` hoist the data up?
        // OR have `useAssignmentData` be called here too?

        // Let's call `useAssignmentData` here to get the current items to lookup names.
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
                onValueChange={(value) => setAssigneeType(value as any)}
            >
                <TabsList className={`grid w-full grid-cols-${getTabCount()}`}>
                    {objective?.type === "CORPORATE" && (
                        <TabsTrigger value="DIVISION" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Division
                        </TabsTrigger>
                    )}
                    {(objective?.type === "CORPORATE" || objective?.type === "DIVISION") && (
                        <TabsTrigger value="DEPARTMENT" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Department
                        </TabsTrigger>
                    )}
                    {objective?.type === "DEPARTMENT" && (
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
    const { selectedAssignees, selectedKPIs, assigneeType, addAssignment, clearSelectedAssignees } = useAssignmentContext();

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
        <div className="flex justify-center">
            <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white">
                Add {selectedAssignees.length} to Assignment List
            </Button>
        </div>
    );
}
