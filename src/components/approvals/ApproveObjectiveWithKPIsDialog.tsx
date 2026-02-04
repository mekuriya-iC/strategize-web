"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface KPISubmission {
  kpiId: string;
  name: string;
  status: string;
  weight?: number;
  baseline?: number | string;
  submissionId?: string;
}

interface ApproveObjectiveWithKPIsDialogProps {
  children: React.ReactNode;
  submission: {
    submissionId: string;
    objective?: { name?: string; type?: string } | null;
    level?: string;
  }; // The objective submission
  associatedKPIs: KPISubmission[]; // KPIs from objective.kpis
  onApprove: (
    submissionId: string,
    reason: string,
    selectedKPIs?: string[]
  ) => Promise<void>;
}

export default function ApproveObjectiveWithKPIsDialog({
  children,
  submission,
  associatedKPIs,
  onApprove,
}: ApproveObjectiveWithKPIsDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with all KPIs selected by default
  useEffect(() => {
    if (open) {
      const allKPIIds = associatedKPIs.map((kpi) => kpi.kpiId);
      setSelectedKPIs(allKPIIds);
      setReason("");
    }
  }, [open, associatedKPIs]);

  const handleKPIToggle = (kpiId: string) => {
    setSelectedKPIs((prev) =>
      prev.includes(kpiId)
        ? prev.filter((id) => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  const handleSelectAll = () => {
    const allKPIIds = associatedKPIs.map((kpi) => kpi.kpiId);
    setSelectedKPIs(allKPIIds);
  };

  const handleDeselectAll = () => {
    setSelectedKPIs([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onApprove(submission.submissionId, reason.trim(), selectedKPIs);
      setOpen(false);
    } catch (error) {
      console.error("Error approving objective with KPIs:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = selectedKPIs.length;
  const totalCount = associatedKPIs.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approve Objective with KPIs
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Objective Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Objective</h3>
            <p className="text-sm text-gray-700">
              {submission.objective?.name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {submission.objective?.type}
              </Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                {submission.level}
              </Badge>
            </div>
          </div>

          {/* KPI Selection */}
          {associatedKPIs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Associated KPIs ({selectedCount}/{totalCount} selected)
                </h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedCount === totalCount}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={selectedCount === 0}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {associatedKPIs.map((kpi) => (
                  <div
                    key={kpi.kpiId}
                    className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${selectedKPIs.includes(kpi.kpiId)
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <Checkbox
                      checked={selectedKPIs.includes(kpi.kpiId)}
                      onCheckedChange={() => handleKPIToggle(kpi.kpiId)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {kpi.name}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>Weight: {kpi.weight ?? "N/A"}%</span>
                        <span>Baseline: {kpi.baseline || "N/A"}</span>
                        <Badge
                          className={`text-xs ${kpi.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-600"
                              : kpi.status === "APPROVED"
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {kpi.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedCount === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  ⚠️ No KPIs selected. The objective will be approved without
                  any KPIs.
                </div>
              )}
            </div>
          )}

          {/* Approval Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Approval Comments (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add any comments about this approval..."
              className="min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Objective
                  {selectedCount > 0 &&
                    ` + ${selectedCount} KPI${selectedCount > 1 ? "s" : ""}`}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
