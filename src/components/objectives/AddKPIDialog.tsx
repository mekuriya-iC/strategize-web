"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import KPIForm from "./KPIForm";
import type { Objective as GraphQLObjective } from "@/types/graphql";

interface AddKPIDialogProps {
  children?: React.ReactNode;
  objective: GraphQLObjective;
  onSuccess?: () => void;
}

export default function AddKPIDialog({
  children,
  objective,
  onSuccess,
}: AddKPIDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add KPI
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add KPI to &ldquo;{objective.name || "Unnamed Objective"}&rdquo;
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <KPIForm
              objectiveId={objective.objectiveId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              objective={objective}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
