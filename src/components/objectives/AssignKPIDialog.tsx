"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Handshake, Target, Users } from "lucide-react";
import { AssignmentProvider } from "@/context/AssignmentContext";
import type { Objective, Kpi } from "@/types/graphql";
import { AssignObjectiveContent } from "./assign-dialog";
import { SupportAssignmentForm } from "./support-assignment";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AssignKPIDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kpi: Kpi;
    targetOwnerAvailable?: boolean;
    onSuccess?: () => void;
}

export default function AssignKPIDialog({
    open,
    onOpenChange,
    kpi,
    targetOwnerAvailable = true,
    onSuccess,
}: AssignKPIDialogProps) {
    const [contributionType, setContributionType] = React.useState<"TARGET_OWNER" | "SUPPORT">(
        targetOwnerAvailable ? "TARGET_OWNER" : "SUPPORT",
    );

    const effectiveContributionType = targetOwnerAvailable
        ? contributionType
        : "SUPPORT";

    // If dialog is not open, don't render content
    if (!open) return null;

    // We need the objective because children are created under it
    const objective = kpi.objective as Objective;

    if (!objective) {
        console.error("KPI has no associated objective for assignment", kpi);
        return null;
    }

    const isTopLevelCorporate = objective.type === "CORPORATE" && !objective.parent;

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

                {isTopLevelCorporate && (
                    <div className="space-y-3">
                        <Label>Contribution type</Label>
                        <RadioGroup
                            value={effectiveContributionType}
                            onValueChange={(value) => {
                                if (value === "SUPPORT" || targetOwnerAvailable) {
                                    setContributionType(value as "TARGET_OWNER" | "SUPPORT");
                                }
                            }}
                            className="grid gap-3 sm:grid-cols-2"
                        >
                            <Label
                                htmlFor="target-owner"
                                className={`flex items-start gap-3 rounded-lg border p-4 has-[[data-state=checked]]:border-purple-500 has-[[data-state=checked]]:bg-purple-50 ${targetOwnerAvailable ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-60"}`}
                            >
                                <RadioGroupItem id="target-owner" value="TARGET_OWNER" disabled={!targetOwnerAvailable} className="mt-1" />
                                <Target className="mt-0.5 h-5 w-5 text-purple-600" />
                                <span>
                                    <span className="block font-semibold">Target owner</span>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {targetOwnerAvailable
                                            ? "Allocate a target and weight through the normal assignment flow."
                                            : "Unavailable because the allocatable target is exhausted or this KPI uses DIRECT mode."}
                                    </span>
                                </span>
                            </Label>
                            <Label
                                htmlFor="support"
                                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-purple-500 has-[[data-state=checked]]:bg-purple-50"
                            >
                                <RadioGroupItem id="support" value="SUPPORT" className="mt-1" />
                                <Handshake className="mt-0.5 h-5 w-5 text-purple-600" />
                                <span>
                                    <span className="block font-semibold">Support</span>
                                    <span className="text-sm font-normal text-muted-foreground">Request contribution without allocating the corporate target or weight.</span>
                                </span>
                            </Label>
                        </RadioGroup>
                    </div>
                )}

                {isTopLevelCorporate && effectiveContributionType === "SUPPORT" ? (
                    <SupportAssignmentForm
                        objective={objective}
                        kpi={kpi}
                        onSuccess={onSuccess}
                        onClose={() => onOpenChange(false)}
                    />
                ) : (
                    /* We pass ONLY this KPI to the provider so it's the only one selectable */
                    <AssignmentProvider objective={objective} kpis={[kpi]}>
                        <AssignObjectiveContent onSuccess={onSuccess} onClose={() => onOpenChange(false)} />
                    </AssignmentProvider>
                )}
            </DialogContent>
        </Dialog>
    );
}
