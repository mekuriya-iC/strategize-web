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
import CreateKPIForm from "@/components/objectives/CreateKPIForm"; // Updated import
import type { Objective as GraphQLObjective } from "@/types/graphql";

interface AddKPIDialogProps {
  children?: React.ReactNode;
  objective: GraphQLObjective;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  renderTrigger?: boolean;
}

export default function AddKPIDialog({
  children,
  objective,
  onSuccess,
  open: externalOpen,
  onOpenChange: setExternalOpen,
  renderTrigger = true,
}: AddKPIDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      {renderTrigger && (
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
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add KPI to &ldquo;{objective.title || objective.name || "Unnamed Objective"}&rdquo;
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <CreateKPIForm
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
