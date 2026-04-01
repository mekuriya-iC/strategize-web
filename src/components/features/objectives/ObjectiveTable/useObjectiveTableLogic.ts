import { useMemo, useState } from "react";
import { Objective, Kpi } from "@/types/graphql";
import { useAuthStore } from "@/stores";
import { useObjectivesOrder } from "@/hooks/objectives/useObjectivesOrder";
import {
    DragEndEvent,
    DragStartEvent,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

interface UseObjectiveTableLogicProps {
    objectives: Objective[];
    allObjectives: Objective[];
    kpis: Kpi[];
    groupBy: "none" | "division" | "department" | "personnel";
    enableSorting: boolean;
    onOrderChange?: (objectives: Objective[]) => void;
    sortConfig: { key: string; direction: "asc" | "desc" } | null;
}

export const useObjectiveTableLogic = ({
    objectives,
    allObjectives,
    kpis,
    groupBy,
    enableSorting,
    onOrderChange,
    sortConfig,
}: UseObjectiveTableLogicProps) => {
    const user = useAuthStore((state) => state.user);
    const { saveOrder, isSaving } = useObjectivesOrder();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [activeId, setActiveId] = useState<string | null>(null);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const sortedObjectives = useMemo(() => {
        let result = [...objectives];

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof Objective];
                const bValue = b[sortConfig.key as keyof Objective];

                if (sortConfig.key === "createdAt") {
                    return sortConfig.direction === "asc"
                        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (typeof aValue === "string" && typeof bValue === "string") {
                    return sortConfig.direction === "asc"
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                const valA = aValue as any;
                const valB = bValue as any;
                if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
                if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
            return result;
        }

        if (enableSorting) {
            return result.sort((a, b) => {
                const orderA = (a as any).order ?? Infinity;
                const orderB = (b as any).order ?? Infinity;
                return orderA - orderB;
            });
        }

        return result;
    }, [objectives, enableSorting, sortConfig]);

    const groupedObjectives = useMemo(() => {
        if (groupBy === "none") return { "All": sortedObjectives };

        const groups: Record<string, Objective[]> = {};
        sortedObjectives.forEach((obj) => {
            let key = "Unassigned";

            if (groupBy === "personnel") {
                const parentDeptObj = allObjectives.find((ao) => ao.objectiveId === obj.parent?.objectiveId);
                if (parentDeptObj) {
                    const deptId = parentDeptObj.assigneeId || "Unknown Dept";
                    const parentDivObj = allObjectives.find((ao) => ao.objectiveId === parentDeptObj.parent?.objectiveId);
                    const divId = parentDivObj?.assigneeId || "Unknown Div";
                    key = `${divId}|${deptId}`;
                } else {
                    key = "Other|Direct Assignments";
                }
            } else {
                key = obj.assigneeId || "Unassigned";
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(obj);
        });
        return groups;
    }, [sortedObjectives, groupBy, allObjectives]);

    const groupKeys = useMemo(() => Object.keys(groupedObjectives), [groupedObjectives]);

    const columnHeaders = useMemo(() => {
        if (groupBy && groupBy !== "none") {
            switch (groupBy) {
                case "division": return { firstColumn: "CORPORATE OBJECTIVE", secondColumn: "DIVISION OBJECTIVE", showSecondColumn: true };
                case "department": return { firstColumn: "DIVISION OBJECTIVE", secondColumn: "DEPARTMENT OBJECTIVE", showSecondColumn: true };
                case "personnel": return { firstColumn: "DEPARTMENT OBJECTIVE", secondColumn: "PERSONAL OBJECTIVE", showSecondColumn: true };
            }
        }

        const allCorporate = objectives.every((obj) => obj.type === "CORPORATE");
        const hasDiv = objectives.some((obj) => obj.type === "DIVISION");
        const hasDept = objectives.some((obj) => obj.type === "DEPARTMENT");
        const hasPers = objectives.some((obj) => obj.type === "PERSONNEL");

        switch (user?.role) {
            case "SUPER_ADMIN":
            case "ADMIN":
                if (allCorporate) return { firstColumn: "CORPORATE OBJECTIVE", secondColumn: null, showSecondColumn: false };
                if (hasDiv && !hasDept && !hasPers) return { firstColumn: "CORPORATE OBJECTIVE", secondColumn: "DIVISION OBJECTIVE", showSecondColumn: true };
                if (hasDept && !hasPers) return { firstColumn: "PARENT OBJECTIVE", secondColumn: "DEPARTMENT OBJECTIVE", showSecondColumn: true };
                if (hasPers) return { firstColumn: "DEPARTMENT OBJECTIVE", secondColumn: "PERSONAL OBJECTIVE", showSecondColumn: true };
                return { firstColumn: "CORPORATE OBJECTIVE", secondColumn: "CHILD OBJECTIVE", showSecondColumn: true };
            case "DIRECTOR": return { firstColumn: "CORPORATE OBJECTIVE", secondColumn: "DIVISION OBJECTIVE", showSecondColumn: true };
            case "MANAGER":
            case "COORDINATOR":
                if (allCorporate) return { firstColumn: "CORPORATE OBJECTIVE", secondColumn: null, showSecondColumn: false };
                return { firstColumn: "DIVISION OBJECTIVE", secondColumn: "DEPARTMENT OBJECTIVE", showSecondColumn: true };
            case "NORMAL": return { firstColumn: "DEPARTMENT OBJECTIVE", secondColumn: "PERSONNEL OBJECTIVE", showSecondColumn: true };
            default: return { firstColumn: "STRATEGIC OBJECTIVE", secondColumn: "OBJECTIVE", showSecondColumn: true };
        }
    }, [objectives, groupBy, user?.role]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = sortedObjectives.findIndex((obj) => obj.objectiveId === active.id);
            const newIndex = sortedObjectives.findIndex((obj) => obj.objectiveId === over.id);
            const reordered = arrayMove(sortedObjectives, oldIndex, newIndex);
            onOrderChange?.(reordered);
            try {
                await saveOrder(reordered.map((obj, index) => ({ objectiveId: obj.objectiveId, order: index + 1 })));
            } catch {
                onOrderChange?.(sortedObjectives);
            }
        }
        setActiveId(null);
    };

    const objectiveIds = useMemo(() => sortedObjectives.map((obj) => obj.objectiveId), [sortedObjectives]);
    const activeObjective = useMemo(() => sortedObjectives.find((obj) => obj.objectiveId === activeId), [sortedObjectives, activeId]);

    return {
        sortedObjectives,
        groupedObjectives,
        groupKeys,
        columnHeaders,
        expandedGroups,
        toggleGroup,
        sensors,
        handleDragStart,
        handleDragEnd,
        objectiveIds,
        activeObjective,
        isSaving,
        activeId,
    };
};
