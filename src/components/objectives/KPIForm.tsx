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
import { useKPIFormState } from "@/hooks/objectives/useKPIFormState";
import { useStrategicPlansQuery } from "@/hooks/strategic-plans/useStrategicPlans";
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
  // Fetch strategic plans to get organizationId
  const { strategicPlans } = useStrategicPlansQuery();
  const activeStrategicPlan = strategicPlans.find(plan => plan.isActive);
  const organizationId = activeStrategicPlan?.organization?.organizationId || "";

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
    getLevelAllocation,
    createKpi,
    updateKpi,
    client,
    strategicPeriodState,
  } = state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const remainingAllocation = getRemainingAllocation();
    const levelAllocation = getLevelAllocation();

    const isValid = validateForm({
      formData,
      objective,
      isQuarterlyMode,
      yearlyQuarters,
      targets,
      canEditTargets,
      kpi,
      remainingAllocation,
      levelAllocation,
      strategicTargetsById,
    });

    if (!isValid) return;

    if (isKPIApproved && objective?.type !== "CORPORATE") {
      toast.error("Approved KPIs cannot be modified.");
      return;
    }

    setIsSubmitting(true);

    try {
      let validTargets: KpiTargetInput[] = [];

      if (isQuarterlyMode) {
        // Collect quarterly targets
        for (const [year, quarters] of Object.entries(yearlyQuarters)) {
          validTargets.push(
            { timeline: `${year}-Q1`, target: Number(quarters.q1 || 0) },
            { timeline: `${year}-Q2`, target: Number(quarters.q2 || 0) },
            { timeline: `${year}-Q3`, target: Number(quarters.q3 || 0) },
            { timeline: `${year}-Q4`, target: Number(quarters.q4 || 0) }
          );
        }

        // IMPORTANT: Also save the annual targets entered in "Define Annual Goals" (for independent KPIs)
        if (!parentId) {
          targets.forEach(t => {
            if (t.timeline.trim() && !isNaN(Number(t.target))) {
              // Avoid duplicates if timeline already exists
              if (!validTargets.some(vt => vt.timeline === t.timeline)) {
                validTargets.push({ timeline: t.timeline, target: Number(t.target) });
              }
            }
          });
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
        strategicObjectiveId: objectiveId, // Backend uses strategicObjectiveId
        frequency: "QUARTERLY", // Default to QUARTERLY
        measurementUnit: "NUMBER", // Default to NUMBER
        organizationId: organizationId, // Required by backend
        targetValue: validTargets.length > 0 ? Math.max(...validTargets.map(t => t.target)) : 0, // Calculate from targets
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
          // If it was rejected, reset it to NOT_SUBMITTED so it can be submitted again manually
          ...(isCurrentlyRejected ? { status: "NOT_SUBMITTED" as KpiStatus } : {}),
        };

        await updateKpi({ input: mutationInput });
        toast.success("KPI updated successfully!");
      } else {
        const created = await createKpi({ input: kpiData });

        if (objective?.type === "CORPORATE" && created?.kpiId) {
          await updateKpi({ input: { kpiId: created.kpiId, status: "APPROVED" } });
          toast.success("KPI created and auto-approved");
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
          onParentIdChange={(val) => setParentId(val === "none_standalone" ? "" : val)}
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

            {/* Level Weight Allocation Tracker */}
            {(() => {
              const levelAlloc = getLevelAllocation();
              const currentWeight = Number(formData.weight || 0);
              const totalIfSaved = levelAlloc.used + currentWeight;
              const isOver = totalIfSaved > 100.01;

              return (
                <div className={`mt-2 p-3 rounded-lg border flex flex-col gap-2 ${isOver ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-200"}`}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className={`font-semibold ${isOver ? "text-red-900" : "text-purple-900"}`}>
                        Level Strategic Budget ({objective?.type})
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase">Tracked across all objectives in this category</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-bold ${isOver ? "text-red-600 animate-bounce" : "text-purple-600"}`}>
                        {totalIfSaved.toFixed(1)}% / 100%
                      </span>
                      {isOver && <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter cursor-help" title="Redistribute weight from other KPIs at this level">Strategic Limit Exceeded</span>}
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${isOver ? "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]" : "bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.5)]"}`}
                      style={{ width: `${Math.min(totalIfSaved, 105)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-gray-500">Used by others: {levelAlloc.used.toFixed(1)}%</span>
                    <span className={isOver ? "text-red-500" : "text-purple-500"}>
                      {isOver ? "Redistribution needed" : `Available budget: ${(100 - levelAlloc.used).toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              );
            })()}



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
            {isQuarterlyMode && parentId ? (
              <QuarterlyBreakdown
                yearlyQuarters={yearlyQuarters}
                kpi={kpi}
                canEditTargets={canEditTargets}
                isEditing={isEditing}
                remainingAllocation={remainingAllocation}
                strategicTargetsById={strategicTargetsById}
                onYearlyQuartersChange={setYearlyQuarters}
                weightType={formData.weightType}
                getRemainingAllocation={getRemainingAllocation}
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
              <div className="space-y-6">
                {/* Yearly Targets section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Define Annual Goals</h4>
                    {!parentId && isQuarterlyMode && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Independent KPI
                      </Badge>
                    )}
                  </div>

                  {targets.map((target, index) => (
                    <div
                      key={index}
                      className="flex items-end gap-4 p-4 border rounded-lg bg-white"
                    >
                      <div className="flex-1">
                        <Label htmlFor={`timeline-${index}`}>Year</Label>
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
                        <Label htmlFor={`target-${index}`}>Annual Target Value</Label>
                        <div className="grid grid-cols-1 gap-2">
                          <Input
                            id={`target-${index}`}
                            type="number"
                            step="0.01"
                            value={target.target}
                            onChange={(e) =>
                              handleTargetChange(index, "target", e.target.value)
                            }
                            placeholder="Enter annual target"
                            disabled={!canEditTargets}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeTarget(index)}
                        disabled={targets.length === 1 || !canEditTargets}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTarget}
                    className="w-full border-dashed"
                    disabled={!canEditTargets}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Another Year
                  </Button>
                </div>

                {isQuarterlyMode && !parentId && (
                  <div className="border-t pt-6">
                    <QuarterlyBreakdown
                      yearlyQuarters={yearlyQuarters}
                      kpi={kpi}
                      canEditTargets={canEditTargets}
                      isEditing={isEditing}
                      remainingAllocation={null}
                      strategicTargetsById={strategicTargetsById}
                      onYearlyQuartersChange={setYearlyQuarters}
                      weightType={formData.weightType}
                      getRemainingAllocation={getRemainingAllocation}
                    />
                  </div>
                )}
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
