"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Users } from "lucide-react";
import { AssignmentProvider } from "@/context/AssignmentContext";
import type { Objective, Kpi } from "@/types/graphql";
import { AssignObjectiveContent } from "./assign-dialog";

interface AssignKPIDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kpi: Kpi;
    onSuccess?: () => void;
}

export default function AssignKPIDialog({
    open,
    onOpenChange,
    kpi,
    onSuccess,
}: AssignKPIDialogProps) {
    // If dialog is not open, don't render content
    if (!open) return null;

    // We need the objective because children are created under it
    const objective = kpi.objective as Objective;

    if (!objective) {
        console.error("KPI has no associated objective for assignment", kpi);
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Assign KPI
                    </DialogTitle>
                    <DialogDescription>
                        Assign KPI &quot;{kpi.name}&quot; from &quot;{objective.title || objective.name}&quot; to a{" "}
                        {(() => {
                            const effectiveLevel = objective.assigneeType === "DIVISION" ? "DIVISION"
                                : objective.assigneeType === "DEPARTMENT" ? "DEPARTMENT"
                                : objective.type;
                            if (effectiveLevel === "CORPORATE") return "division or department";
                            if (effectiveLevel === "DIVISION") return "department or employee";
                            return "employee";
                        })()}.
                    </DialogDescription>
                </DialogHeader>

                {/* We pass ONLY this KPI to the provider so it's the only one selectable */}
                <AssignmentProvider objective={objective} kpis={[kpi]}>
                    <AssignObjectiveContent onSuccess={onSuccess} onClose={() => onOpenChange(false)} />
                </AssignmentProvider>
            </DialogContent>
        </Dialog>
    );
}
