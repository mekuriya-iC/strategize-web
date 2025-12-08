"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Objective as GraphQLObjective, KpiTargetInput, KpiStatus, KpiWeightType } from "@/types/graphql";
import { handleSmartSubmission } from "@/utils/smartSubmission";
import { getDetailedUnitLabel } from "@/utils/unitTypeDetection";
import { buildYearRanges } from "./YearSelector";
import { useKPIFormState } from "@/hooks/useKPIFormState";
import {
  KPIFormHeader,
  KPIInformationCard,
  QuarterlyBreakdown,
  validateForm,
  roundTarget,
} from "./kpi-form";
import { kpiLogger } from "@/lib/logger";

interface KPIFormProps {
  objectiveId: string;
  kpiId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  objective?: GraphQLObjective;
  strategicTargetsById?: Record<string, Record<string, number>>;
}

export default function KPIForm({
  objectiveId,
  kpiId,
  onSuccess,
  onCancel,
  objective,
  strategicTargetsById,
}: KPIFormProps) {
  const state = useKPIFormState({
    objectiveId,
    kpiId,
    objective,
    strategicTargetsById,
  });

  const {
    formData,
    parentId,
    targets,
    yearlyQuarters,
    isSubmitting,
    isEditing,
    isKPIApproved,
    canEditStructure,
    canEditTargets,
    isQuarterlyMode,
    candidateParentKPIs,
    kpi,
    loading,
    setParentId,
    setTargets,
    setYearlyQuarters,
    setIsSubmitting,
    handleInputChange,
    handleTargetChange,
    addTarget,
    removeTarget,
    getRemainingAllocation,
    createKpi,
    updateKpi,
    client,
    strategicPeriodState,
  } = state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const remainingAllocation = getRemainingAllocation();

    const isValid = validateForm({
      formData,
      objective,
      isQuarterlyMode,
      yearlyQuarters,
      targets,
      canEditTargets,
      kpi,
      remainingAllocation,
      strategicTargetsById,
    });

    if (!isValid) return;

    setIsSubmitting(true);

    try {
      let validTargets: KpiTargetInput[] = [];

      if (isQuarterlyMode) {
        for (const [year, quarters] of Object.entries(yearlyQuarters)) {
          validTargets.push(
            { timeline: `${year}-Q1`, target: Number(quarters.q1 || 0) },
            { timeline: `${year}-Q2`, target: Number(quarters.q2 || 0) },
            { timeline: `${year}-Q3`, target: Number(quarters.q3 || 0) },
            { timeline: `${year}-Q4`, target: Number(quarters.q4 || 0) }
          );
        }
      } else {
        validTargets = targets
          .map((t) => ({ ...t, target: Number(t.target) }))
          .filter(
            (t) => t.timeline.trim() && !isNaN(t.target) && t.target >= 0
          ) as KpiTargetInput[];
      }

      const kpiData = {
        name: formData.name.trim() || "",
        baseline: formData.baseline ? Number(formData.baseline) : 0,
        weight: formData.weight ? Number(formData.weight) : 0,
        unitType: formData.weightType,
        targets: validTargets,
        objectiveId,
        ...(parentId ? { parentId } : {}),
      };

      kpiLogger.debug("Submitting KPI data:", kpiData);

      if (!objectiveId || !objective) {
        toast.error("Missing objective data. Please refresh and try again.");
        return;
      }

      if (isEditing && kpiId) {
        const isCurrentlyRejected = kpi?.status === "REJECTED";

        const mutationInput = {
          kpiId,
          ...kpiData,
          ...(isCurrentlyRejected ? { status: "PENDING" as KpiStatus } : {}),
        };

        await updateKpi(mutationInput);

        const shouldSubmitUpdate =
          objective?.type !== "CORPORATE" &&
          (isCurrentlyRejected || !isKPIApproved);

        if (shouldSubmitUpdate) {
          try {
            await handleSmartSubmission({
              submissionType: "KPI",
              itemId: kpiId,
              submissionData: {
                type: "KPI",
                level: objective.type as "DIVISION" | "DEPARTMENT" | "PERSONNEL",
                itemId: kpiId,
                reason: isCurrentlyRejected
                  ? "KPI updated after rejection - resubmitted for approval"
                  : "KPI structure and targets submitted for approval",
              },
              reason: isCurrentlyRejected
                ? "KPI updated after rejection - resubmitted for approval"
                : "KPI structure and targets submitted for approval",
              client: client as unknown as import("@/utils/smartSubmission").ApolloClient,
            });

            toast.success(
              isCurrentlyRejected
                ? "KPI updated and resubmitted for approval!"
                : "KPI structure and targets submitted for approval!"
            );
          } catch (submissionError) {
            kpiLogger.error("Error creating submission:", submissionError);
            toast.success(
              "KPI updated successfully, but failed to create submission."
            );
          }
        } else {
          toast.success("KPI updated successfully!");
        }
      } else {
        const created = await createKpi(kpiData);

        if (objective?.type === "CORPORATE" && created?.kpiId) {
          await updateKpi({ kpiId: created.kpiId, status: "APPROVED" });
          toast.success("KPI created and auto-approved");
        } else if (created?.kpiId && objective?.type !== "CORPORATE") {
          try {
            await handleSmartSubmission({
              submissionType: "KPI",
              itemId: created.kpiId,
              submissionData: {
                type: "KPI",
                level: objective.type as "DIVISION" | "DEPARTMENT" | "PERSONNEL",
                itemId: created.kpiId,
                reason: "KPI structure and targets submitted for approval",
              },
              reason: "KPI structure and targets submitted for approval",
              client: client as unknown as import("@/utils/smartSubmission").ApolloClient,
            });
            toast.success("KPI created and submitted for approval");
          } catch (submissionError) {
            kpiLogger.error("Error creating submission:", submissionError);
            toast.success(
              "KPI created successfully, but failed to create submission."
            );
          }
        } else {
          toast.success("KPI created successfully!");
        }
      }

      onSuccess();
    } catch (error) {
      kpiLogger.error(`Error ${isEditing ? "updating" : "creating"} KPI:`, error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} KPI. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingAllocation = getRemainingAllocation();

  if (isEditing && loading) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      <KPIFormHeader isEditing={isEditing} onCancel={onCancel} />

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <KPIInformationCard
          formData={formData}
          parentId={parentId}
          candidateParentKPIs={candidateParentKPIs}
          objective={objective}
          canEditStructure={canEditStructure}
          kpiId={kpiId}
          onInputChange={handleInputChange}
          onParentIdChange={setParentId}
        />

        {/* Targets Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Targets
              {objective?.type !== "CORPORATE" && (
                <Badge variant="secondary" className="ml-2">
                  Required for submission
                </Badge>
              )}
            </CardTitle>

            {/* Remaining Allocation Display */}
            {remainingAllocation && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-900">
                      Parent Target:
                    </span>
                    <span className="text-blue-700">
                      {roundTarget(remainingAllocation.available)}{" "}
                      {kpi ? getDetailedUnitLabel(kpi) : "units"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">
                      Used by Siblings: {roundTarget(remainingAllocation.used)}
                    </span>
                    <span className="text-blue-600">
                      ({Math.round((remainingAllocation.used / remainingAllocation.available) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  Available for this KPI: {roundTarget(remainingAllocation.remaining)}{" "}
                  {kpi ? getDetailedUnitLabel(kpi) : "units"}
                </div>
              </div>
            )}

            {/* Process Documentation */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">
                📋 Single Approval Process
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white">
                    1
                  </span>
                  <span>Complete KPI Setup</span>
                </div>
                <div className="ml-6 text-xs text-blue-700">
                  Set KPI name, baseline, weight, and targets together
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white">
                    2
                  </span>
                  <span>Single Submission</span>
                </div>
                <div className="ml-6 text-xs text-blue-700">
                  Submit everything for approval in one step. If rejected, you
                  can edit and resubmit.
                </div>
              </div>
            </div>

            {!canEditTargets && (
              <p className="text-sm text-orange-600">
                Targets cannot be edited after approval
              </p>
            )}
          </CardHeader>

          <CardContent>
            {isQuarterlyMode ? (
              <QuarterlyBreakdown
                yearlyQuarters={yearlyQuarters}
                kpi={kpi}
                canEditTargets={canEditTargets}
                isEditing={isEditing}
                remainingAllocation={remainingAllocation}
                strategicTargetsById={strategicTargetsById}
                onYearlyQuartersChange={setYearlyQuarters}
                onReloadTargets={() => {
                  if (kpi?.targets && kpi.targets.length > 0) {
                    const tgs = kpi.targets.map((t) => ({
                      timeline: t.timeline,
                      target: t.target.toString(),
                    }));
                    setTargets(tgs);
                  }
                }}
              />
            ) : (
              <div className="space-y-4">
                {strategicPeriodState?.annualTimeline && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <span>🔄</span>
                      <span>
                        Synced with objective details page:{" "}
                        <strong>{strategicPeriodState.annualTimeline}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {targets.map((target, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Label htmlFor={`timeline-${index}`}>Timeline</Label>
                      <Select
                        value={target.timeline}
                        onValueChange={(val) =>
                          handleTargetChange(index, "timeline", val)
                        }
                        disabled={!canEditTargets}
                      >
                        <SelectTrigger id={`timeline-${index}`}>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {objective?.strategicPeriod &&
                            buildYearRanges(objective.strategicPeriod).map(
                              (yr) => (
                                <SelectItem key={yr} value={yr}>
                                  {yr}
                                </SelectItem>
                              )
                            )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`target-${index}`}>Target Value</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          id={`target-${index}`}
                          type="number"
                          step="0.01"
                          value={target.target}
                          onChange={(e) =>
                            handleTargetChange(index, "target", e.target.value)
                          }
                          placeholder="Enter target value"
                          disabled={!canEditTargets}
                        />
                        <Select
                          value={formData.weightType}
                          onValueChange={(value: KpiWeightType) =>
                            handleInputChange("weightType", value)
                          }
                          disabled={!canEditTargets}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NUMBER">Number</SelectItem>
                            <SelectItem value="PERCENT">Percent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeTarget(index)}
                      disabled={targets.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addTarget}
                  className="w-full"
                  disabled={!canEditTargets}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Target
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#3838EC] hover:bg-[#2e2ed6]"
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update KPI"
              : "Create KPI"}
          </Button>
        </div>
      </form>
    </div>
  );
}

