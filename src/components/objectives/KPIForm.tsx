"use client";
import React, { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useKPIMutations } from "@/hooks/useKPIMutations";
import { useKPI, useKPIs } from "@/hooks/useKPIs";
import { useObjective } from "@/hooks/useObjectives";
import {
  KpiWeightType,
  KpiTargetInput,
  Objective as GraphQLObjective,
} from "@/types/graphql";
import { toast } from "sonner";
// import { useStrategicPeriod } from "@/context/StrategicPeriodContext";
import { buildYearRanges } from "./YearSelector";

interface KPIFormProps {
  objectiveId: string;
  kpiId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  objective?: GraphQLObjective; // Objective data for validation
}

export default function KPIForm({
  objectiveId,
  kpiId,
  onSuccess,
  onCancel,
  objective,
}: KPIFormProps) {
  const isEditing = Boolean(kpiId);
  const { createKpi, updateKpi, loading } = useKPIMutations();
  const { kpi, loading: kpiLoading } = useKPI(
    kpiId ? { kpiId } : { kpiId: "" }
  );

  // Fetch all KPIs to find current and parent KPIs
  const { kpis } = useKPIs({
    page: 1,
    limit: 1000,
  });
  // const { selected } = useStrategicPeriod();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    baseline: "",
    weight: "",
    weightType: "PERCENT" as KpiWeightType,
  });

  // Use a string for target during input to avoid prefilling 0
  // Default to first available year, independent of objective detail page selector
  const defaultTimeline = React.useMemo(() => {
    if (objective?.strategicPeriod) {
      const options = buildYearRanges(objective.strategicPeriod);
      return options[0] || "";
    }
    return "";
  }, [objective?.strategicPeriod]);

  const [targets, setTargets] = useState<
    Array<{ timeline: string; target: string }>
  >([{ timeline: defaultTimeline, target: "" }]);

  // Quarterly mode: for inherited KPIs (when objective has parent)
  const isInheritedKPI = Boolean(objective?.parent);

  // Show quarterly inputs for inherited KPIs
  const isQuarterlyMode = isInheritedKPI;

  // Debug logging
  console.log("KPIForm Debug:", {
    objective: objective?.name,
    objectiveType: objective?.type,
    hasParent: Boolean(objective?.parent),
    parentName: objective?.parent?.name,
    isQuarterlyMode,
    kpiId,
    isEditing,
  });

  // Multi-year quarterly data structure
  // Format: { "2025/26": { q1: "10", q2: "15", q3: "12", q4: "13" } }
  const [yearlyQuarters, setYearlyQuarters] = useState<
    Record<
      string,
      {
        q1: string;
        q2: string;
        q3: string;
        q4: string;
        parentTarget?: number; // The target value from parent KPI
      }
    >
  >({});

  // Fetch parent objective and its KPIs for inherited KPIs
  const { objective: parentObjective } = useObjective({
    objectiveId: objective?.parent?.objectiveId || "",
  });

  const { kpis: parentKPIs } = useKPIs({
    page: 1,
    limit: 1000,
  });

  // Get parent KPI data for this inherited KPI
  const getParentKPI = () => {
    if (!objective?.parent || !parentObjective || !parentKPIs) return null;

    // Find parent KPIs for the parent objective
    const parentObjKPIs = parentKPIs.filter(
      (kpi) => kpi.objective?.objectiveId === objective.parent?.objectiveId
    );

    // Find current KPI's index in the current objective's KPIs
    const currentObjKPIs = kpis.filter(
      (kpi) => kpi.objective?.objectiveId === objectiveId
    );
    const kpiIndex = currentObjKPIs.findIndex((k) => k.kpiId === kpiId);

    // Return corresponding parent KPI by index
    return parentObjKPIs[kpiIndex] || null;
  };

  const parentKPI = getParentKPI();

  // Note: Removed automatic sync with objective detail page year selector
  // KPI timeline selection is now independent for better UX

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing KPI data when editing
  useEffect(() => {
    if (isEditing && kpi && !kpiLoading) {
      setFormData({
        name: kpi.name,
        baseline: kpi.baseline.toString(),
        weight: kpi.weight.toString(),
        // Force percent for weight per updated requirement
        weightType: "PERCENT",
      });
      // Parse existing targets
      const tgs =
        kpi.targets.length > 0
          ? kpi.targets.map((t) => ({
              timeline: t.timeline,
              target: t.target.toString(),
            }))
          : [{ timeline: defaultTimeline, target: "" }];
      setTargets(tgs);

      // If quarterly mode, load quarterly data for all years
      if (isQuarterlyMode) {
        // Initialize yearly quarters from existing KPI targets (handles both yearly and quarterly-only datasets)
        const newYearlyQuarters: typeof yearlyQuarters = {};

        // Derive set of years from BOTH yearly and quarterly entries
        const allYears = Array.from(
          new Set(tgs.map((t) => t.timeline.split("-")[0]))
        );

        allYears.forEach((year) => {
          const findQuarterVal = (q: string) =>
            tgs.find((t) => t.timeline === `${year}-Q${q}`)?.target ?? "";

          newYearlyQuarters[year] = {
            q1: findQuarterVal("1"),
            q2: findQuarterVal("2"),
            q3: findQuarterVal("3"),
            q4: findQuarterVal("4"),
            parentTarget: undefined, // Will be set from parent data
          };
        });

        setYearlyQuarters(newYearlyQuarters);
      }
    }
  }, [isEditing, kpi, kpiLoading, defaultTimeline, isQuarterlyMode]);

  // Load parent KPI targets when in quarterly mode (support yearly or quarterly-only parent data)
  useEffect(() => {
    if (isQuarterlyMode && parentKPI) {
      setYearlyQuarters((prev) => {
        const updated = { ...prev };

        const parentTargets = parentKPI.targets || [];
        const parentYears = Array.from(
          new Set(parentTargets.map((t) => t.timeline.split("-")[0]))
        );
        parentYears.forEach((year) => {
          // Prefer yearly entry; otherwise sum quarters
          const yearly = parentTargets.find((t) => t.timeline === year);
          let total: number | undefined = yearly
            ? Number(yearly.target)
            : undefined;
          if (total === undefined) {
            const sum = ["1", "2", "3", "4"].reduce((acc, q) => {
              const qt = parentTargets.find(
                (t) => t.timeline === `${year}-Q${q}`
              )?.target;
              return acc + (qt !== undefined ? Number(qt) : 0);
            }, 0);
            if (sum > 0) total = sum;
          }
          if (total !== undefined) {
            if (updated[year]) {
              updated[year].parentTarget = total;
            } else {
              updated[year] = {
                q1: "",
                q2: "",
                q3: "",
                q4: "",
                parentTarget: total,
              };
            }
          }
        });

        return updated;
      });
    }
  }, [isQuarterlyMode, parentKPI]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTargetChange = (
    index: number,
    field: "timeline" | "target",
    value: string
  ) => {
    setTargets((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const addTarget = () => {
    setTargets((prev) => [...prev, { timeline: "", target: "" }]);
  };

  const removeTarget = (index: number) => {
    if (targets.length > 1) {
      setTargets((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    // Optional: Check baseline value if provided
    if (formData.baseline && isNaN(Number(formData.baseline))) {
      toast.error("Please enter a valid baseline value");
      return false;
    }

    // Optional: Check weight value if provided
    if (formData.weight && isNaN(Number(formData.weight))) {
      toast.error("Please enter a valid weight value");
      return false;
    }

    // In quarterly mode ensure quarter numbers are valid (non-blocking against corporate target)
    if (isQuarterlyMode) {
      for (const [year, quarters] of Object.entries(yearlyQuarters)) {
        const vals = [quarters.q1, quarters.q2, quarters.q3, quarters.q4].map(
          (v) => (v === "" ? 0 : Number(v))
        );

        // Validate each quarter value
        for (const v of vals) {
          if (isNaN(v) || v < 0) {
            toast.error(
              `Please enter valid non-negative quarter values for ${year}`
            );
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let validTargets: KpiTargetInput[] = [];
      if (isQuarterlyMode) {
        // Generate targets for all years and their quarters
        for (const [year, quarters] of Object.entries(yearlyQuarters)) {
          // Add quarterly targets for this year
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
        weightType: "PERCENT" as KpiWeightType,
        targets: validTargets as KpiTargetInput[],
        objectiveId,
      };

      // Debug logging
      console.log("KPI Data being sent:", kpiData);
      console.log("Valid targets:", validTargets);
      console.log("Objective ID:", objectiveId);

      // Additional validation
      if (!objectiveId) {
        toast.error(
          "Objective ID is missing. Please refresh the page and try again."
        );
        return;
      }

      if (!objective) {
        toast.error(
          "Objective data is missing. Please refresh the page and try again."
        );
        return;
      }

      if (isEditing && kpiId) {
        await updateKpi({
          input: {
            kpiId,
            ...kpiData,
          },
        });
        toast.success("KPI updated successfully!");
      } else {
        const created = await createKpi({
          input: kpiData,
        });

        // Auto-approve KPIs created under corporate-level objectives
        if (objective?.type === "CORPORATE" && created?.kpiId) {
          await updateKpi({
            input: {
              kpiId: created.kpiId,
              status: "APPROVED",
            },
          });
        }

        toast.success(
          objective?.type === "CORPORATE"
            ? "KPI created and auto-approved"
            : "KPI created successfully!"
        );
      }

      onSuccess();
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(`Error ${isEditing ? "updating" : "creating"} KPI:`, error);

      // Enhanced error logging
      if (err?.networkError) {
        console.error("Network error:", err.networkError);
      }
      if (err?.graphQLErrors) {
        console.error("GraphQL errors:", err.graphQLErrors);
      }

      // More specific error messages
      let errorMessage = `Failed to ${
        isEditing ? "update" : "create"
      } KPI. Please try again.`;

      if (typeof err?.message === "string") {
        errorMessage += ` Error: ${err.message}`;
      }

      if (err?.graphQLErrors && err.graphQLErrors.length > 0) {
        const graphQLError = err.graphQLErrors[0];
        errorMessage = `GraphQL Error: ${graphQLError.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && kpiLoading) {
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-[#3F3F46]">
          {isEditing ? "Edit KPI" : "Add New KPI"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>KPI Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">KPI Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter KPI name"
                />
              </div>

              <div>
                <Label htmlFor="baseline">Baseline Value</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="baseline"
                    type="number"
                    step="0.01"
                    value={formData.baseline}
                    onChange={(e) =>
                      handleInputChange("baseline", e.target.value)
                    }
                    placeholder="Enter baseline value"
                  />
                  <div>
                    <Label className="sr-only" htmlFor="baseline-unit">
                      Unit Type
                    </Label>
                    <Select
                      value={formData.weightType}
                      onValueChange={(value: KpiWeightType) =>
                        handleInputChange("weightType", value)
                      }
                    >
                      <SelectTrigger id="baseline-unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NUMBER">Number</SelectItem>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="weight">Weight (%)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="Enter weight"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targets */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Targets</CardTitle>
          </CardHeader>
          <CardContent>
            {isQuarterlyMode ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Quarterly Breakdown
                  </h4>
                  <p className="text-sm text-blue-700">
                    Break down the yearly targets from your parent into
                    quarterly values. Each year&apos;s quarters must sum to the
                    parent target.
                  </p>
                </div>

                {Object.entries(yearlyQuarters).map(([year, quarters]) => (
                  <div key={year} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium text-gray-900">{year}</h5>
                      {quarters.parentTarget !== undefined && (
                        <div className="text-sm text-gray-600">
                          Target:{" "}
                          <span className="font-medium">
                            {quarters.parentTarget}
                          </span>
                          {(() => {
                            const sum = [
                              quarters.q1,
                              quarters.q2,
                              quarters.q3,
                              quarters.q4,
                            ]
                              .map((v) => Number(v || 0))
                              .reduce((a, b) => a + b, 0);
                            return (
                              <span
                                className={`ml-2 ${
                                  sum === quarters.parentTarget
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                (Sum: {sum})
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {(["q1", "q2", "q3", "q4"] as const).map(
                        (quarter, index) => (
                          <div key={quarter}>
                            <Label>Q{index + 1}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={quarters[quarter]}
                              onChange={(e) => {
                                setYearlyQuarters((prev) => ({
                                  ...prev,
                                  [year]: {
                                    ...prev[year],
                                    [quarter]: e.target.value,
                                  },
                                }));
                              }}
                              placeholder="0"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}

                {Object.keys(yearlyQuarters).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No yearly targets found from parent KPI.</p>
                    <p className="text-sm mt-1">
                      Your parent needs to set yearly targets first.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {targets.map((target, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Label htmlFor={`timeline-${index}`}>Timeline</Label>
                      <Select
                        value={target.timeline}
                        onValueChange={(val) => {
                          handleTargetChange(index, "timeline", val);
                        }}
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
                        />
                        <div>
                          <Label
                            className="sr-only"
                            htmlFor={`target-unit-${index}`}
                          >
                            Unit Type
                          </Label>
                          <Select
                            value={formData.weightType}
                            onValueChange={(value: KpiWeightType) =>
                              handleInputChange("weightType", value)
                            }
                          >
                            <SelectTrigger id={`target-unit-${index}`}>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NUMBER">Number</SelectItem>
                              <SelectItem value="PERCENT">Percent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
