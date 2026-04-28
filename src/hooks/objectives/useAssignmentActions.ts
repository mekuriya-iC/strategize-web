"use client";

import { useMutation, useApolloClient } from "@apollo/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAssignmentContext } from "@/context/AssignmentContext";
import { useObjectiveAssignment } from "@/hooks/objectives/useObjectiveAssignment";
import { useObjectiveMutations } from "@/hooks/objectives/useObjectiveMutations";
import { useKPIMutations } from "@/hooks/objectives/useKPIMutations";
import { useStrategicPlansQuery } from "@/hooks/strategic-plans/useStrategicPlans";
import { useStrategicPeriodStore } from "@/stores";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { buildYearRanges } from "@/components/objectives/YearSelector";
import { detectKPIType, getDetailedUnitLabel } from "@/utils/unitTypeDetection";
import { appLogger } from "@/lib/logger";

// Helper to get assignee objective type based on source and assignee type
function getAssigneeObjectiveType(
    sourceType: string,
    assigneeType: string
): "DIVISION" | "DEPARTMENT" | "PERSONNEL" {
    if (sourceType === "CORPORATE") {
        return assigneeType === "DIVISION" ? "DIVISION" : "DEPARTMENT";
    } else if (sourceType === "DIVISION") {
        return "DEPARTMENT";
    } else {
        return "PERSONNEL";
    }
}

export function useAssignmentActions({ onSuccess, onClose }: { onSuccess?: () => void; onClose: () => void }) {
    const client = useApolloClient();
    const {
        assignments,
        sourceObjective,
        availableKPIs,
        targets,
        assigneeType,
        clearAssignments,
        clearSelectedAssignees
    } = useAssignmentContext();

    const { assignObjective } = useObjectiveAssignment();
    const { updateObjective } = useObjectiveMutations();
    const { updateKpi, createKpi } = useKPIMutations();
    const { selectedPeriod, annualTimeline } = useStrategicPeriodStore();
    
    // Fetch strategic plans to get organizationId
    const { strategicPlans } = useStrategicPlansQuery();
    const activeStrategicPlan = strategicPlans.find(plan => plan.isActive);
    const organizationId = activeStrategicPlan?.organization?.organizationId || "";

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper: Get timeline
    const getTimelineFromContext = useCallback(() => {
        if (annualTimeline) return annualTimeline;
        if (sourceObjective?.strategicPeriod) {
            const yearRanges = buildYearRanges(sourceObjective.strategicPeriod);
            return yearRanges[0] || "2025/26";
        }
        return "2025/26";
    }, [annualTimeline, sourceObjective]);

    // Helper: Get current user ID (Assigner)
    // We fetch this imperatively or use a hook. 
    // Optimization: In a real app, this should be in AuthContext. For now, small query.
    const getAssignerId = async () => {
        const { data } = await client.query({ query: GET_ME });
        return data?.me?.employeeId;
    };

    const handleSubmit = async () => {
        if (assignments.length === 0 || !sourceObjective) return;
        setIsSubmitting(true);

        try {
            const assignerId = await getAssignerId();
            if (!assignerId) throw new Error("Could not identify current user ID");

            // Process assignments sequentially to ensure strict isolation

            for (const assignment of assignments) {

                // 1. Check if child objective exists for this assignee from this parent
                // Strict Check: Fetch only objectives for this specific assigneeId
                const { data: existingData } = await client.query({
                    query: GET_OBJECTIVES,
                    variables: { assigneeId: assignment.assigneeId, limit: 100 },
                    fetchPolicy: "network-only"
                });

                const existingObjective = existingData?.objectives?.items?.find(
                    (obj: any) => obj.parent?.objectiveId === sourceObjective.objectiveId
                );


                let targetObjectiveId = existingObjective?.objectiveId;

                // 2. If not exists, create it
                if (!existingObjective) {

                    // Explicitly pass ONLY the KPIs selected for THIS assignment
                    const created = await assignObjective({
                        objectiveId: sourceObjective.objectiveId,
                        assigneeId: assignment.assigneeId,
                        assignerId,
                        assigneeType: assignment.assigneeType,
                        kpis: assignment.kpis,
                    });


                    if (created?.objectiveId) {
                        targetObjectiveId = created.objectiveId;
                        // Fix up name and type (Legacy requirement)
                        const correctType = getAssigneeObjectiveType(sourceObjective.type, assignment.assigneeType);
                        const typeLabel = assignment.assigneeType === "DIVISION" ? "Division" : assignment.assigneeType === "DEPARTMENT" ? "Department" : "Personnel";
                        const placeholderName = `Please add ${typeLabel} objective name`;

                        await updateObjective({
                            input: {
                                objectiveId: created.objectiveId,
                                type: correctType,
                                title: placeholderName,
                            }
                        });
                    }
                } else {
                }

                // 3. Handle KPIs logic (Add missing KPIs if we found existing objective)
                if (existingObjective && targetObjectiveId) {
                    const existingKpiNames = new Set(existingObjective.kpis?.map((k: any) => k.name));

                    for (const kpiId of assignment.kpis) {
                        const sourceKpi = availableKPIs.find(k => k.kpiId === kpiId);
                        // Strict check: Ensure we only adding the KPI if it's in the current assignment's list
                        if (sourceKpi && !existingKpiNames.has(sourceKpi.name)) {
                            await createKpi({
                                input: {
                                    name: sourceKpi.name,
                                    baseline: sourceKpi.baseline || 0,
                                    weight: sourceKpi.weight || 0,
                                    unitType: sourceKpi.unitType || "NUMBER",
                                    strategicObjectiveId: targetObjectiveId, // Backend uses strategicObjectiveId
                                    parentId: sourceKpi.kpiId,
                                    frequency: "QUARTERLY", // Default to QUARTERLY
                                    measurementUnit: "NUMBER", // Default to NUMBER
                                    organizationId: organizationId, // Required by backend
                                    targetValue: 0, // Will be updated with targets
                                    targets: []
                                }
                            });
                        }
                    }
                }

                // 4. Update Targets - STRICTLY for this assignee
                // We need to fetch the FRESH child objective to get the IDs of the child KPIs
                const { data: freshData } = await client.query({
                    query: GET_OBJECTIVES,
                    variables: { assigneeId: assignment.assigneeId, limit: 100 },
                    fetchPolicy: "network-only"
                });
                const freshObjective = freshData?.objectives?.items?.find(
                    (obj: any) => obj.objectiveId === targetObjectiveId
                );

                if (freshObjective) {
                    const timeline = getTimelineFromContext();

                    for (const sourceKpiId of assignment.kpis) {
                        // STRICT: Get target ONLY for the current assignment.assigneeId
                        const targetValue = targets[sourceKpiId]?.[assignment.assigneeId];

                        if (targetValue === undefined || targetValue === null) {
                            continue;
                        }

                        // Map Source KPI ID -> Child KPI ID
                        const sourceKpiName = availableKPIs.find(k => k.kpiId === sourceKpiId)?.name;
                        const childKpi = freshObjective.kpis?.find((k: any) =>
                            k.parent?.kpiId === sourceKpiId || k.name === sourceKpiName
                        );

                        if (childKpi) {
                            await updateKpi({
                                input: {
                                    kpiId: childKpi.kpiId,
                                    targets: [{
                                        timeline,
                                        target: targetValue
                                    }]
                                }
                            });
                        } else {
                            console.warn(`[useAssignmentActions] Could not find child KPI for source KPI ${sourceKpiId}`);
                        }
                    }
                }
            }

            toast.success("Assignment completed successfully");
            clearAssignments();
            clearSelectedAssignees();
            onSuccess?.();
            onClose();

        } catch (error: any) {
            appLogger.error("Assignment failed", error);
            toast.error("Assignment failed", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        handleSubmit,
        isSubmitting
    };
}
