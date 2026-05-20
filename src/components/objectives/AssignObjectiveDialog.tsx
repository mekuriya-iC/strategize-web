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

interface AssignObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: Objective;
  kpis: Kpi[];
  onSuccess?: () => void;
}

export default function AssignObjectiveDialog({
  open,
  onOpenChange,
  objective,
  kpis,
  onSuccess,
}: AssignObjectiveDialogProps) {
  // If dialog is not open, don't render content to avoid unnecessary mounts/fetches
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Objective
          </DialogTitle>
          <DialogDescription>
            Assign &quot;{objective.title || objective.name}&quot; to a{" "}
            {(() => {
              // Determine effective level from assigneeType (for cascaded objectives)
              const effectiveLevel = objective.assigneeType === "DIVISION" ? "DIVISION"
                : objective.assigneeType === "DEPARTMENT" ? "DEPARTMENT"
                : objective.type;
              if (effectiveLevel === "CORPORATE") return "division or department";
              if (effectiveLevel === "DIVISION") return "department or employee";
              return "employee";
            })()}{" "}
            with selected KPIs.
          </DialogDescription>
        </DialogHeader>

        <AssignmentProvider objective={objective} kpis={kpis}>
          <AssignObjectiveContent onSuccess={onSuccess} onClose={() => onOpenChange(false)} />
        </AssignmentProvider>
      </DialogContent>
    </Dialog>
  );
}
