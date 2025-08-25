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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useKPIMutations } from "@/hooks/useKPIMutations";
import { useKPI, useKPIs } from "@/hooks/useKPIs";
import { useObjective } from "@/hooks/useObjectives";
import {
  KpiWeightType,
  KpiTargetInput,
  KpiStatus,
  Objective as GraphQLObjective,
} from "@/types/graphql";
import { toast } from "sonner";
import { handleSmartSubmission } from "@/utils/smartSubmission";
import { useApolloClient } from "@apollo/client";
import { useStrategicPeriod } from "@/context/StrategicPeriodContext";
import { buildYearRanges } from "./YearSelector";
import { getDetailedUnitLabel } from "@/utils/unitTypeDetection";

interface KPIFormProps {
  objectiveId: string;
  kpiId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  objective?: GraphQLObjective; // Objective data for validation
  // Optional: corporate/parent yearly target by child KPI id and year
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
  const isEditing = Boolean(kpiId);
  const { createKpi, updateKpi, loading } = useKPIMutations();
  const client = useApolloClient();

  const { kpi, loading: kpiLoading } = useKPI(
    kpiId ? { kpiId } : { kpiId: "" }
  );

  // Fetch all KPIs to find current and parent KPIs
  const { kpis, refetch: refetchKPIs } = useKPIs({
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

  // Parent KPI mapping (for child KPIs under a non-corporate objective)
  const [parentId, setParentId] = useState<string>("");

  // Check if KPI is approved (for single approval process)
  const isKPIApproved = kpi?.status === "APPROVED";
  const isKPIRejected = kpi?.status === "REJECTED";
  const canEditStructure = !isKPIApproved || objective?.type === "CORPORATE";
  // Allow target editing for all non-approved states (single approval process)
  const canEditTargets = !isKPIApproved || objective?.type === "CORPORATE";

  // Get shared strategic period context to sync with objective details page
  const { selected: strategicPeriodState, setSelected: setStrategicPeriod } =
    useStrategicPeriod();

  // Use a string for target during input to avoid prefilling 0
  // Sync with objective details page year selector
  const defaultTimeline = React.useMemo(() => {
    if (objective?.strategicPeriod) {
      const options = buildYearRanges(objective.strategicPeriod);

      // If there's a shared year selection, use it; otherwise use first available
      if (
        strategicPeriodState?.annualTimeline &&
        options.includes(strategicPeriodState.annualTimeline)
      ) {
        return strategicPeriodState.annualTimeline;
      }
      return options[0] || "";
    }
    return "";
  }, [objective?.strategicPeriod, strategicPeriodState?.annualTimeline]);

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
    kpiStatus: kpi?.status,
    isKPIApproved,
    isKPIRejected,
    canEditTargets,
    canEditStructure,
    targets: targets,
  });

  // Removed unused getYearlyTotals function

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
    console.log("🔍 getParentKPI called:", {
      hasObjectiveParent: !!objective?.parent,
      hasParentObjective: !!parentObjective,
      hasParentKPIs: !!parentKPIs,
      parentId,
      objectiveId,
      kpiId,
    });

    if (!objective?.parent || !parentObjective || !parentKPIs) {
      console.log("❌ Missing required data for getParentKPI");
      return null;
    }

    // If we have a parentId (from form selection), use that directly
    if (parentId) {
      const selectedParentKPI = parentKPIs.find(
        (kpi) => kpi.kpiId === parentId
      );
      console.log("🔗 Found parent KPI by parentId:", {
        parentId,
        found: !!selectedParentKPI,
        parentKPI: selectedParentKPI?.name,
      });
      return selectedParentKPI || null;
    }

    // Fallback to index-based matching for backward compatibility
    const parentObjKPIs = parentKPIs.filter(
      (kpi) => kpi.objective?.objectiveId === objective.parent?.objectiveId
    );

    const currentObjKPIs = kpis.filter(
      (kpi) => kpi.objective?.objectiveId === objectiveId
    );
    const kpiIndex = currentObjKPIs.findIndex((k) => k.kpiId === kpiId);

    const result = parentObjKPIs[kpiIndex] || null;
    console.log("🔗 Found parent KPI by index:", {
      parentObjKPIsCount: parentObjKPIs.length,
      currentObjKPIsCount: currentObjKPIs.length,
      kpiIndex,
      found: !!result,
      parentKPI: result?.name,
    });
    return result;
  };

  const parentKPI = getParentKPI();

  // Debug logging for targets and quarterly data
  console.log("KPIForm Targets Debug:", {
    yearlyQuarters: yearlyQuarters,
    targets: targets,
    isQuarterlyMode,
    canEditTargets,
    kpiStatus: kpi?.status,
    hasTargets: kpi?.targets && kpi.targets.length > 0,
    targetsCount: kpi?.targets?.length || 0,
  });

  // Helper function to calculate remaining allocation for child KPIs
  const getRemainingAllocation = (): {
    available: number;
    used: number;
    remaining: number;
  } | null => {
    console.log("🔧 getRemainingAllocation - Debug:", {
      kpiParent: kpi?.parent || null,
      objectiveParent: objective?.parent || null,
      kpiId: kpi?.kpiId || null,
      parentId: parentId,
    });

    // Only calculate for child KPIs (KPIs with parents)
    const hasParentKpi = kpi?.parent?.kpiId;
    const hasParentId = parentId;

    if (!hasParentKpi && !hasParentId) {
      console.log("❌ No parent relationship found");
      return null;
    }

    if (!objective?.parent) {
      console.log("❌ No objective parent found");
      return null;
    }

    const parentKpiId = hasParentKpi || hasParentId || "";
    const currentKpiId = kpi?.kpiId;

    // Get parent KPI's assigned target
    const parentKPI = getParentKPI();
    if (!parentKPI) {
      console.log("❌ No parent KPI found via getParentKPI()");

      // Fallback: Try to get parent KPI from strategicTargetsById if we have parentId
      if (hasParentId && strategicTargetsById?.[hasParentId]) {
        const parentTargets = strategicTargetsById[hasParentId];
        const parentTarget = Object.values(parentTargets).reduce(
          (sum, target) => sum + target,
          0
        );

        console.log("🔧 getRemainingAllocation - fallback parentTarget:", {
          parentId: hasParentId,
          parentTarget,
          parentTargets,
        });

        if (parentTarget === 0) {
          return null;
        }

        // For fallback, we can't calculate siblings, so show full allocation
        return {
          available: parentTarget,
          used: 0,
          remaining: parentTarget,
        };
      }

      return null;
    }

    // Get parent KPI's total target for the timeline
    const parentTargets = parentKPI.targets || [];
    const parentTarget = parentTargets.reduce(
      (sum, target) => sum + target.target,
      0
    );

    console.log("🔧 getRemainingAllocation - parentTarget:", {
      defaultTimeline,
      parentTarget,
      parentKPI: parentKPI.name,
      parentTargets: parentTargets,
    });

    if (parentTarget === 0) {
      return null;
    }

    // Find all child KPIs that share the same parent (excluding current KPI if editing)
    const siblingKPIs = kpis.filter(
      (kpi) =>
        kpi.parent?.kpiId === parentKpiId &&
        kpi.kpiId !== currentKpiId &&
        kpi.kpiId !== undefined // Ensure we don't include KPIs without IDs
    );

    // Calculate total used by siblings
    const usedAllocation = siblingKPIs.reduce((total, siblingKpi) => {
      const siblingTargets = siblingKpi.targets || [];
      const siblingTotal = siblingTargets.reduce(
        (sum, target) => sum + target.target,
        0
      );
      return total + siblingTotal;
    }, 0);

    // If this is a new KPI (no kpiId yet), show full remaining allocation
    // If this is an existing KPI being edited, include its current targets in the calculation
    const currentKpiTargets = kpi?.targets || [];
    const currentKpiTotal = currentKpiTargets.reduce(
      (sum, target) => sum + target.target,
      0
    );

    // For new KPIs: remaining = parentTarget - usedAllocation
    // For existing KPIs: remaining = parentTarget - usedAllocation (since we're editing, we can reuse the current allocation)
    const remaining = Math.max(0, parentTarget - usedAllocation);

    console.log("🔧 getRemainingAllocation:", {
      parentKpiId,
      currentKpiId,
      parentTarget,
      allKPIs: kpis.map((k) => ({
        id: k.kpiId,
        name: k.name,
        parentId: k.parent?.kpiId,
      })),
      siblingKPIs: siblingKPIs.map((k) => ({ id: k.kpiId, name: k.name })),
      usedAllocation,
      currentKpiTotal,
      remaining,
      isNewKPI: !currentKpiId,
    });

    return {
      available: parentTarget,
      used: usedAllocation,
      remaining: remaining,
    };
  };

  // Force refresh KPI data if it's a rejected KPI with no targets
  useEffect(() => {
    if (
      isEditing &&
      kpi?.status === "REJECTED" &&
      (!kpi.targets || kpi.targets.length === 0)
    ) {
      console.log(
        "🔧 Force refreshing KPI data for rejected KPI with no targets"
      );
      refetchKPIs();
    }
  }, [isEditing, kpi?.status, kpi?.targets, refetchKPIs]);

  // Candidate parent KPIs for selection (when this objective has a parent)
  const candidateParentKPIs = React.useMemo(() => {
    // For division/department objectives, we want to show corporate KPIs as candidates
    if (!objective?.parent) return [] as Array<{ kpiId: string; name: string }>;

    // Find KPIs that belong to the corporate objective (parent of current objective)
    const corporateKPIs = (parentKPIs || [])
      .filter((k) => k.objective?.objectiveId === objective.parent?.objectiveId)
      .map((k) => ({ kpiId: k.kpiId, name: k.name }));

    console.log("Candidate parent KPIs:", {
      objectiveParentId: objective.parent?.objectiveId,
      allParentKPIs: parentKPIs?.length || 0,
      filteredCorporateKPIs: corporateKPIs.length,
      corporateKPIs: corporateKPIs,
      allParentKPIsData: parentKPIs?.map((k) => ({
        kpiId: k.kpiId,
        name: k.name,
        objectiveId: k.objective?.objectiveId,
        objectiveType: k.objective?.type,
      })),
    });

    return corporateKPIs;
  }, [objective?.parent, parentKPIs]);

  // Note: Removed automatic sync with objective detail page year selector
  // KPI timeline selection is now independent for better UX

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Force refresh KPI data when form loads, especially for child KPIs
  useEffect(() => {
    if (
      kpiId &&
      kpi?.parent?.kpiId &&
      (!kpi?.targets || kpi.targets.length === 0)
    ) {
      console.log("🔄 Force refreshing KPI data for child KPI:", kpiId);
      // Refetch the KPI data to get the latest assigned targets
      client.refetchQueries({
        include: ["GetKPI"],
      });
    }
  }, [kpiId, kpi?.parent?.kpiId, kpi?.targets, client]);

  // Load existing KPI data when editing
  useEffect(() => {
    if (isEditing && kpi && !kpiLoading) {
      console.log("🔄 Loading existing KPI data:", {
        kpiId: kpi.kpiId,
        name: kpi.name,
        parent: kpi.parent,
        hasParent: !!kpi.parent?.kpiId,
        parentId: kpi.parent?.kpiId,
      });

      console.log("🔄 Loading KPI data into form:", {
        kpiName: kpi.name,
        kpiWeightType: kpi.unitType,
        kpiBaseline: kpi.baseline,
        kpiWeight: kpi.weight,
      });

      setFormData({
        name: kpi.name,
        baseline: kpi.baseline.toString(),
        weight: kpi.weight.toString(),
        // Use the actual weightType from the KPI
        weightType: kpi.unitType,
      });

      // Set parentId from existing KPI if it has a parent
      if (kpi.parent?.kpiId) {
        console.log("🔗 Setting parentId from existing KPI:", kpi.parent.kpiId);
        setParentId(kpi.parent.kpiId);
      } else {
        console.log("⚠️ No parent found for existing KPI");
        setParentId(""); // Clear any existing parentId
      }

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
        console.log("🔧 Loading quarterly data for rejected KPI:", {
          isQuarterlyMode,
          tgs,
          allYears: Array.from(
            new Set(tgs.map((t) => t.timeline.split("-")[0]))
          ),
        });

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

        console.log("🔧 Setting yearlyQuarters:", newYearlyQuarters);
        setYearlyQuarters(newYearlyQuarters);
      } else {
        console.log("🔧 Not in quarterly mode:", {
          isQuarterlyMode,
          isInheritedKPI,
          hasParent: Boolean(objective?.parent),
        });
      }
    }
  }, [isEditing, kpi, kpiLoading, defaultTimeline, isQuarterlyMode]);

  // Separate useEffect to ensure parentId is set correctly when KPI data is loaded
  useEffect(() => {
    if (isEditing && kpi && !kpiLoading && kpi.parent?.kpiId) {
      console.log("🔗 Ensuring parentId is set:", {
        currentParentId: parentId,
        kpiParentId: kpi.parent.kpiId,
        shouldUpdate: parentId !== kpi.parent.kpiId,
      });

      if (parentId !== kpi.parent.kpiId) {
        console.log("🔄 Updating parentId to:", kpi.parent.kpiId);
        setParentId(kpi.parent.kpiId);
      }
    }
  }, [isEditing, kpi, kpiLoading, parentId]);

  // Load parent KPI targets when in quarterly mode (support yearly or quarterly-only parent data)
  useEffect(() => {
    if (isQuarterlyMode && parentKPI) {
      console.log("🔍 Setting parent targets from parentKPI:", {
        parentKPI: parentKPI.name,
        parentKPIId: parentKPI.kpiId,
        targets: parentKPI.targets,
        isQuarterlyMode,
      });

      setYearlyQuarters((prev) => {
        const updated = { ...prev };

        const parentTargets = parentKPI.targets || [];
        const parentYears = Array.from(
          new Set(parentTargets.map((t) => t.timeline.split("-")[0]))
        );

        console.log("📅 Parent years found:", parentYears);

        parentYears.forEach((year) => {
          // Prefer yearly entry; otherwise sum quarters
          const yearly = parentTargets.find((t) => t.timeline === year);
          let total: number | undefined = yearly
            ? Number(yearly.target)
            : undefined;

          console.log(`🎯 Year ${year}:`, {
            yearlyTarget: yearly,
            yearlyValue: total,
          });

          if (total === undefined) {
            const sum = ["1", "2", "3", "4"].reduce((acc, q) => {
              const qt = parentTargets.find(
                (t) => t.timeline === `${year}-Q${q}`
              )?.target;
              return acc + (qt !== undefined ? Number(qt) : 0);
            }, 0);
            if (sum > 0) total = sum;
            console.log(`📊 Sum of quarters for ${year}:`, sum);
          }

          console.log(`✅ Final total for ${year}:`, total);

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
            console.log(`💾 Set parentTarget for ${year}:`, total);
          }
        });

        console.log("📋 Final updated yearlyQuarters:", updated);
        return updated;
      });
    }
  }, [isQuarterlyMode, parentKPI]);

  // Auto-populate baseline and weight when parent KPI is selected
  useEffect(() => {
    if (parentId && !isEditing) {
      // Find the selected parent KPI
      const selectedParentKPI = parentKPIs?.find(
        (kpi) => kpi.kpiId === parentId
      );

      if (selectedParentKPI) {
        console.log("Auto-populating from parent KPI:", selectedParentKPI.name);

        // Auto-populate baseline, weight, and name from parent KPI
        setFormData((prev) => ({
          ...prev,
          baseline: selectedParentKPI.baseline.toString(),
          weight: selectedParentKPI.weight.toString(),
          name: selectedParentKPI.name,
        }));

        // Prepare target data from parent KPI for display (even if not editable)
        if (selectedParentKPI.targets && selectedParentKPI.targets.length > 0) {
          // For quarterly mode, prepare quarterly breakdown
          if (isQuarterlyMode) {
            const newYearlyQuarters: typeof yearlyQuarters = {};

            selectedParentKPI.targets.forEach((target) => {
              const parts = target.timeline.split("-");
              if (parts.length === 2 && parts[1].startsWith("Q")) {
                const year = parts[0];
                const quarter = parts[1].toLowerCase();

                if (!newYearlyQuarters[year]) {
                  newYearlyQuarters[year] = {
                    q1: "",
                    q2: "",
                    q3: "",
                    q4: "",
                    parentTarget: 0,
                  };
                }

                (newYearlyQuarters[year] as Record<string, string | number>)[
                  quarter
                ] = target.target.toString();
              } else {
                // Yearly target
                const year = target.timeline;
                if (!newYearlyQuarters[year]) {
                  newYearlyQuarters[year] = {
                    q1: "",
                    q2: "",
                    q3: "",
                    q4: "",
                    parentTarget: target.target,
                  };
                } else {
                  newYearlyQuarters[year].parentTarget = target.target;
                }
              }
            });

            setYearlyQuarters(newYearlyQuarters);
          } else {
            // For non-quarterly mode, prepare regular targets
            const preparedTargets = selectedParentKPI.targets.map((target) => ({
              timeline: target.timeline,
              target: target.target.toString(),
            }));
            setTargets(preparedTargets);
          }
        }
      }
    }
  }, [parentId, parentKPIs, isEditing, isQuarterlyMode]);

  // Sync targets with shared year selection from objective details page
  useEffect(() => {
    if (strategicPeriodState?.annualTimeline && objective?.strategicPeriod) {
      const options = buildYearRanges(objective.strategicPeriod);

      if (options.includes(strategicPeriodState.annualTimeline)) {
        console.log(
          "🔄 Syncing KPIForm targets with shared year:",
          strategicPeriodState.annualTimeline
        );

        // Update the first target's timeline to match the shared selection
        setTargets((prev) => {
          if (
            prev.length > 0 &&
            prev[0].timeline !== strategicPeriodState.annualTimeline
          ) {
            return prev.map((target, index) =>
              index === 0
                ? { ...target, timeline: strategicPeriodState.annualTimeline! }
                : target
            );
          }
          return prev;
        });
      }
    }
  }, [strategicPeriodState?.annualTimeline, objective?.strategicPeriod]);

  // Initialize strategic period context when form loads
  useEffect(() => {
    if (objective?.strategicPeriod && !strategicPeriodState?.period) {
      const options = buildYearRanges(objective.strategicPeriod);
      setStrategicPeriod({
        period: objective.strategicPeriod,
        annualTimeline: options[0] || "",
      });
      console.log("🎯 Initialized strategic period context:", {
        period: objective.strategicPeriod,
        annualTimeline: options[0],
      });
    }
  }, [
    objective?.strategicPeriod,
    strategicPeriodState?.period,
    setStrategicPeriod,
  ]);

  const handleInputChange = (field: string, value: string) => {
    console.log("🔄 handleInputChange called:", { field, value });
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      console.log("🔄 Updated form data:", newData);
      return newData;
    });
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

  // Calculate quarterly sum for validation
  const calculateQuarterlySum = (year: string): number => {
    const quarters = yearlyQuarters[year];
    if (!quarters) return 0;

    return (
      (quarters.q1 === "" ? 0 : Number(quarters.q1)) +
      (quarters.q2 === "" ? 0 : Number(quarters.q2)) +
      (quarters.q3 === "" ? 0 : Number(quarters.q3)) +
      (quarters.q4 === "" ? 0 : Number(quarters.q4))
    );
  };

  // Get assigned target from current KPI's targets (the actual assigned value)
  const getAssignedTarget = (year: string): number | null => {
    console.log("🔍 getAssignedTarget Debug:", {
      year,
      kpiId: kpi?.kpiId,
      kpiName: kpi?.name,
      hasTargets: !!kpi?.targets,
      targetsCount: kpi?.targets?.length || 0,
      targets: kpi?.targets,
      parentKpiId: kpi?.parent?.kpiId,
      strategicTargetsById: strategicTargetsById,
      isChildKPI: !!kpi?.parent?.kpiId,
    });

    // PRIORITY 1: Check current KPI's targets (the actual assigned value)
    if (kpi?.targets && kpi.targets.length > 0) {
      // First, try to find exact yearly target
      const currentTarget = kpi.targets.find((t) => t.timeline === year);
      if (currentTarget) {
        console.log(
          `✅ Found assigned target in current KPI for ${year}:`,
          currentTarget.target
        );
        return currentTarget.target;
      }

      // If no yearly target found, sum quarterly targets for this year
      const quarterlyTargets = kpi.targets.filter(
        (t) =>
          t.timeline.startsWith(year.split("/")[0]) && t.timeline.includes("-Q")
      );

      if (quarterlyTargets.length > 0) {
        const quarterlySum = quarterlyTargets.reduce(
          (sum, t) => sum + t.target,
          0
        );
        console.log(
          `✅ Found quarterly targets for ${year}, sum:`,
          quarterlySum,
          "from targets:",
          quarterlyTargets
        );
        return quarterlySum;
      }

      console.log(`❌ No target found in current KPI for year ${year}`);
    } else {
      console.log(`❌ Current KPI has no targets array or empty targets`);
    }

    // PRIORITY 2: For child KPIs (assigned KPIs), if they have no targets,
    // this might indicate a data refresh issue. We should NOT fall back to strategic targets
    // as this would show the wrong assigned value.
    if (kpi?.parent?.kpiId) {
      console.log(
        `⚠️ This is a child KPI (assigned KPI) but has no targets stored`
      );
      console.log(
        `⚠️ This might indicate a data refresh issue after assignment`
      );
      console.log(
        `⚠️ NOT falling back to strategic targets to avoid showing wrong assigned target`
      );

      // TODO: In a real implementation, we might want to trigger a data refresh here
      // For now, return null to indicate no assigned target found
      return null;
    }

    // PRIORITY 3: For corporate KPIs only, fall back to strategic targets
    if (!kpi?.parent?.kpiId) {
      if (strategicTargetsById?.[kpi?.kpiId || ""]?.[year] !== undefined) {
        const strategicTarget = strategicTargetsById[kpi?.kpiId || ""][year];
        console.log(
          `📊 Using strategic target for corporate KPI ${year}:`,
          strategicTarget
        );
        return strategicTarget;
      }
    }

    // PRIORITY 4: Final fallback for corporate KPIs - check parent KPI targets
    if (!kpi?.parent?.kpiId) {
      const parentKPI = kpis.find((k) => k.kpiId === kpi?.parent?.kpiId);
      if (parentKPI?.targets) {
        const parentTarget = parentKPI.targets.find((t) => t.timeline === year);
        if (parentTarget) {
          console.log(
            `🔗 Using parent KPI target for ${year}:`,
            parentTarget.target
          );
          return parentTarget.target;
        }
      }
    }

    console.log(`❌ No assigned target found for ${year}`);
    return null;
  };

  // Validate quarterly breakdown against remaining allocation
  const validateQuarterlyBreakdown = (
    year: string
  ): {
    isValid: boolean;
    message: string;
    assignedTarget: number | null;
    currentSum: number;
    unitLabel: string;
    remainingAllocation?: number;
  } => {
    const assignedTarget = getAssignedTarget(year);
    const currentSum = calculateQuarterlySum(year);
    const remainingAllocation = getRemainingAllocation();

    if (assignedTarget === null) {
      return {
        isValid: true,
        message: "No assigned target found",
        assignedTarget: null,
        currentSum,
        unitLabel: kpi ? getDetailedUnitLabel(kpi) : "units",
      };
    }

    const unitLabel = kpi ? getDetailedUnitLabel(kpi) : "units";

    // Check against remaining allocation if available
    if (remainingAllocation) {
      const maxAllowed = remainingAllocation.remaining;

      if (currentSum > maxAllowed) {
        return {
          isValid: false,
          message: `Quarterly sum (${currentSum} ${unitLabel}) exceeds available allocation (${maxAllowed} ${unitLabel})`,
          assignedTarget,
          currentSum,
          unitLabel,
          remainingAllocation: remainingAllocation.remaining,
        };
      }
    } else {
      // Fallback to original validation
      if (currentSum > assignedTarget) {
        return {
          isValid: false,
          message: `Quarterly sum (${currentSum} ${unitLabel}) exceeds assigned target (${assignedTarget} ${unitLabel})`,
          assignedTarget,
          currentSum,
          unitLabel,
        };
      }
    }

    if (Math.abs(currentSum - assignedTarget) < 0.01) {
      return {
        isValid: true,
        message: `Perfect! Quarterly sum matches assigned target`,
        assignedTarget,
        currentSum,
        unitLabel,
        remainingAllocation: remainingAllocation?.remaining,
      };
    }

    return {
      isValid: true,
      message: `Quarterly sum (${currentSum} ${unitLabel}) is below assigned target (${assignedTarget} ${unitLabel})`,
      assignedTarget,
      currentSum,
      unitLabel,
      remainingAllocation: remainingAllocation?.remaining,
    };
  };

  const validateForm = () => {
    // Validate structure fields for all non-corporate objectives
    if (objective?.type !== "CORPORATE") {
      // Validate structure fields
      if (!formData.name.trim()) {
        toast.error("Please enter a KPI name");
        return false;
      }

      // Validate baseline value if provided
      if (formData.baseline && isNaN(Number(formData.baseline))) {
        toast.error("Please enter a valid baseline value");
        return false;
      }

      // Validate weight value if provided
      if (formData.weight && isNaN(Number(formData.weight))) {
        toast.error("Please enter a valid weight value");
        return false;
      }
    }

    // Validate targets are provided for non-corporate objectives
    if (objective?.type !== "CORPORATE") {
      if (isQuarterlyMode) {
        // Check if any quarterly targets are set
        const hasQuarterlyTargets = Object.values(yearlyQuarters).some(
          (quarters) =>
            [quarters.q1, quarters.q2, quarters.q3, quarters.q4].some(
              (q) => q !== "" && Number(q) > 0
            )
        );
        if (!hasQuarterlyTargets) {
          toast.error("Please set at least one quarterly target value");
          return false;
        }
      } else {
        // Check if any yearly targets are set
        const hasYearlyTargets = targets.some(
          (t) =>
            t.timeline.trim() &&
            !isNaN(Number(t.target)) &&
            Number(t.target) > 0
        );
        if (!hasYearlyTargets) {
          toast.error("Please set at least one target value");
          return false;
        }
      }
    }

    // In quarterly mode ensure quarter numbers are valid and don't exceed assigned targets
    if (isQuarterlyMode && canEditTargets) {
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

        // Validate quarterly breakdown against assigned target
        const validation = validateQuarterlyBreakdown(year);
        if (!validation.isValid) {
          toast.error(
            `Quarterly breakdown validation failed for ${year}: ${validation.message}`
          );
          return false;
        }
      }
    }

    return true;
  };

  // Debug logging for parent KPI selection
  console.log("🎯 Parent KPI Select Debug:", {
    parentId,
    candidateParentKPIs: candidateParentKPIs.length,
    isEditing,
    canEditStructure,
    hasParentInKPI: !!kpi?.parent?.kpiId,
    kpiParentId: kpi?.parent?.kpiId,
  });

  // Debug logging for current form state
  console.log("📋 Current form state:", {
    formData,
    weightType: formData.weightType,
    isEditing,
    kpiWeightType: kpi?.unitType,
  });

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

      const kpiData: {
        name: string;
        baseline: number;
        weight: number;
        unitType: KpiWeightType;
        targets: KpiTargetInput[];
        objectiveId: string;
        parentId?: string;
        status?: KpiStatus;
      } = {
        name: formData.name.trim() || "",
        baseline: formData.baseline ? Number(formData.baseline) : 0,
        weight: formData.weight ? Number(formData.weight) : 0,
        unitType: formData.weightType, // Use the weightType as unitType
        targets: validTargets as KpiTargetInput[],
        objectiveId,
      };

      if (parentId) {
        kpiData.parentId = parentId;
      }

      // Debug logging
      console.log("🔍 Form data before submission:", {
        formData,
        weightType: formData.weightType,
        baseline: formData.baseline,
        weight: formData.weight,
      });
      console.log("KPI Data being sent:", kpiData);
      console.log("Valid targets:", validTargets);
      console.log("Objective ID:", objectiveId);
      console.log("Parent ID being sent:", parentId);
      console.log("Candidate parent KPIs available:", candidateParentKPIs);
      console.log(
        "Selected parent KPI:",
        candidateParentKPIs.find((p) => p.kpiId === parentId)
      );

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
        const isCurrentlyRejected = kpi?.status === "REJECTED";

        // Set parentId from existing KPI if editing
        if (kpi?.parent?.kpiId && !parentId) {
          setParentId(kpi.parent.kpiId);
        }

        // Update KPI data (can include parentId and targets)
        console.log("🔍 About to update KPI with data:", {
          kpiId,
          kpiData,
          unitType: kpiData.unitType,
        });

        const mutationInput = {
          kpiId,
          ...kpiData,
          // Reset status to PENDING if currently rejected
          ...(isCurrentlyRejected ? { status: "PENDING" as KpiStatus } : {}),
        };

        console.log(
          "🔍 GraphQL Mutation Input:",
          JSON.stringify(mutationInput, null, 2)
        );

        const updateResult = await updateKpi(mutationInput);

        console.log("🔍 Update KPI result:", updateResult);

        // Single approval submission for non-corporate objectives
        const shouldSubmitUpdate =
          objective?.type !== "CORPORATE" &&
          (isCurrentlyRejected || !isKPIApproved);

        if (shouldSubmitUpdate) {
          try {
            const submissionData = {
              type: "KPI" as const,
              level: objective.type as "DIVISION" | "DEPARTMENT" | "PERSONNEL",
              itemId: kpiId,
              reason: isCurrentlyRejected
                ? "KPI updated after rejection - resubmitted for approval"
                : "KPI structure and targets submitted for approval",
            };

            console.log("🔍 KPIForm AUTO-SUBMISSION DEBUG - Editing KPI:", {
              isEditing: true,
              kpiId,
              submissionData,
              objectiveType: objective.type,
            });

            await handleSmartSubmission({
              submissionType: "KPI",
              itemId: kpiId,
              submissionData: submissionData,
              reason: isCurrentlyRejected
                ? "KPI updated after rejection - resubmitted for approval"
                : "KPI structure and targets submitted for approval",
              client:
                client as unknown as import("@/utils/smartSubmission").ApolloClient,
            });

            toast.success(
              isCurrentlyRejected
                ? "KPI updated and resubmitted for approval!"
                : "KPI structure and targets submitted for approval!"
            );
          } catch (submissionError) {
            console.error("Error creating submission:", submissionError);
            toast.success(
              "KPI updated successfully, but failed to create submission. Please submit manually."
            );
          }
        } else {
          toast.success("KPI updated successfully!");
        }
      } else {
        console.log(
          "🔍 GraphQL Create Mutation Input:",
          JSON.stringify(kpiData, null, 2)
        );

        const created = await createKpi(kpiData);

        console.log("🔍 Create KPI result:", created);

        // Auto-approve KPIs created under corporate-level objectives
        if (objective?.type === "CORPORATE" && created?.kpiId) {
          await updateKpi({
            kpiId: created.kpiId,
            status: "APPROVED",
          });
          toast.success("KPI created and auto-approved");
        } else if (created?.kpiId && objective?.type !== "CORPORATE") {
          // Non-corporate: immediately submit for single approval
          try {
            const submissionData = {
              type: "KPI" as const,
              level: objective.type as "DIVISION" | "DEPARTMENT" | "PERSONNEL",
              itemId: created.kpiId,
              reason: "KPI structure and targets submitted for approval",
            };

            console.log("🔍 KPIForm AUTO-SUBMISSION DEBUG - Creating KPI:", {
              isEditing: false,
              kpiId: created.kpiId,
              submissionData,
              objectiveType: objective.type,
            });

            await handleSmartSubmission({
              submissionType: "KPI",
              itemId: created.kpiId,
              submissionData: submissionData,
              reason: "KPI structure and targets submitted for approval",
              client:
                client as unknown as import("@/utils/smartSubmission").ApolloClient, // eslint-disable-line @typescript-eslint/no-explicit-any
            });

            toast.success("KPI created and submitted for approval");
          } catch (submissionError) {
            console.error("Error creating submission:", submissionError);
            toast.success(
              "KPI created successfully, but failed to create submission. Please submit manually."
            );
          }
        } else {
          toast.success("KPI created successfully!");
        }
      }

      onSuccess();
    } catch (error: unknown) {
      const err = error as Error & {
        networkError?: unknown;
        graphQLErrors?: unknown[];
      };
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
        if (
          graphQLError &&
          typeof graphQLError === "object" &&
          "message" in graphQLError
        ) {
          errorMessage = `GraphQL Error: ${
            (graphQLError as { message: string }).message
          }`;
        }
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
            {objective?.parent && (
              <div>
                <Label htmlFor="parent-kpi">Strategic KPI (Parent)</Label>
                <Select
                  value={parentId}
                  onValueChange={(val) => {
                    console.log("🔄 Parent KPI selection changed:", val);
                    setParentId(val);
                  }}
                  disabled={!canEditStructure}
                >
                  <SelectTrigger id="parent-kpi">
                    <SelectValue placeholder="Select strategic KPI (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateParentKPIs.map((pk) => (
                      <SelectItem key={pk.kpiId} value={pk.kpiId}>
                        {pk.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Link this KPI to a corporate KPI. You can create multiple
                  child KPIs for the same strategic KPI.
                </p>
                {parentId && (
                  <p className="text-xs text-blue-600 mt-1">
                    ✓ Auto-populated from parent KPI
                  </p>
                )}
                {!canEditStructure && (
                  <p className="text-xs text-orange-600 mt-1">
                    Parent selection is locked after approval
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">KPI Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter KPI name"
                  disabled={!canEditStructure}
                />
                {parentId && (
                  <p className="text-xs text-blue-600 mt-1">
                    ✓ Auto-populated from parent KPI
                  </p>
                )}
                {!canEditStructure && (
                  <p className="text-xs text-orange-600 mt-1">
                    KPI name is locked after approval
                  </p>
                )}
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
                    disabled={!canEditStructure}
                  />
                  <div>
                    <Label className="sr-only" htmlFor="baseline-unit">
                      Unit Type
                    </Label>
                    <Select
                      key={`baseline-unit-${kpiId}-${formData.weightType}`}
                      value={formData.weightType}
                      onValueChange={(value: KpiWeightType) =>
                        handleInputChange("weightType", value)
                      }
                      disabled={!canEditStructure}
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
                <p className="text-xs text-gray-500 mt-1">
                  Note: This unit type applies to baseline, weight, and targets
                </p>
                {parentId && (
                  <p className="text-xs text-blue-600 mt-1">
                    ✓ Auto-populated from parent KPI
                  </p>
                )}
                {!canEditStructure && (
                  <p className="text-xs text-orange-600 mt-1">
                    Baseline and unit type are locked after approval
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="weight">Weight (%)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="Enter weight (decimal values allowed)"
                  disabled={!canEditStructure}
                />
                {parentId && (
                  <p className="text-xs text-blue-600 mt-1">
                    ✓ Auto-populated from parent KPI
                  </p>
                )}
                {!canEditStructure && (
                  <p className="text-xs text-orange-600 mt-1">
                    Weight is locked after approval
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targets */}
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
            {(() => {
              const allocation = getRemainingAllocation();
              if (allocation) {
                // Calculate percentage based on sibling usage (not current KPI usage)
                const siblingUsagePercentage = Math.round(
                  (allocation.used / allocation.available) * 100
                );
                return (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-900">
                          Parent Target:
                        </span>
                        <span className="text-blue-700">
                          {allocation.available}{" "}
                          {kpi ? getDetailedUnitLabel(kpi) : "units"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">
                          Used by Siblings: {allocation.used}
                        </span>
                        <span className="text-blue-600">
                          ({siblingUsagePercentage}%)
                        </span>
                      </div>
                    </div>
                    {/* Progress bar commented out for now
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(siblingUsagePercentage, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    */}
                    <div className="mt-1 text-xs text-blue-600">
                      Available for this KPI: {allocation.remaining}{" "}
                      {kpi ? getDetailedUnitLabel(kpi) : "units"}
                    </div>
                  </div>
                );
              }
              return null;
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
            {isQuarterlyMode ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Quarterly Breakdown
                  </h4>
                  <p className="text-sm text-blue-700">
                    Break down your assigned targets into quarterly values. The
                    sum of quarters must not exceed your assigned target limit.
                    You&apos;ll see real-time validation to ensure you stay
                    within limits.
                  </p>
                </div>

                {Object.entries(yearlyQuarters).map(([year, quarters]) => {
                  const validation = validateQuarterlyBreakdown(year);

                  return (
                    <div key={year} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium text-gray-900">{year}</h5>
                        <div className="text-sm text-gray-600">
                          {(() => {
                            const allocation = getRemainingAllocation();
                            if (
                              allocation &&
                              allocation.remaining < validation.assignedTarget!
                            ) {
                              return (
                                <>
                                  Available Allocation:{" "}
                                  <span className="font-medium">
                                    {allocation.remaining}{" "}
                                    {validation.unitLabel}
                                  </span>
                                </>
                              );
                            } else if (validation.assignedTarget !== null) {
                              return (
                                <>
                                  Assigned Target:{" "}
                                  <span className="font-medium">
                                    {validation.assignedTarget}{" "}
                                    {validation.unitLabel}
                                  </span>
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      {/* Validation Status */}
                      {validation.assignedTarget !== null && (
                        <div
                          className={`mb-4 p-3 rounded-lg ${
                            validation.isValid
                              ? validation.message.includes("Perfect")
                                ? "bg-green-50 border border-green-200"
                                : "bg-yellow-50 border border-yellow-200"
                              : "bg-red-50 border border-red-200"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-2 text-sm ${
                              validation.isValid
                                ? validation.message.includes("Perfect")
                                  ? "text-green-700"
                                  : "text-yellow-700"
                                : "text-red-700"
                            }`}
                          >
                            <span>
                              {validation.isValid
                                ? validation.message.includes("Perfect")
                                  ? "✅"
                                  : "⚠️"
                                : "❌"}
                            </span>
                            <span>{validation.message}</span>
                          </div>
                          {!validation.isValid && (
                            <p className="text-xs mt-1 text-red-600">
                              Please adjust quarterly values to not exceed the
                              assigned target.
                            </p>
                          )}
                          <div className="text-xs mt-1 text-gray-600">
                            Current quarterly sum: {validation.currentSum}{" "}
                            {validation.unitLabel}
                            {validation.remainingAllocation !== undefined && (
                              <span className="ml-2 text-blue-600">
                                (Available: {validation.remainingAllocation}{" "}
                                {validation.unitLabel})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

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
                                disabled={!canEditTargets}
                                className={
                                  validation.isValid
                                    ? ""
                                    : "border-red-300 focus:border-red-500"
                                }
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}

                {Object.keys(yearlyQuarters).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No yearly targets found from parent KPI.</p>
                    <p className="text-sm mt-1">
                      Your parent needs to set yearly targets first.
                    </p>
                    <p className="text-sm mt-1">
                      If this is a rejected KPI, please check if targets were
                      saved.
                    </p>
                    {isEditing && (
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            // Force reload targets from KPI data
                            if (kpi?.targets && kpi.targets.length > 0) {
                              const tgs = kpi.targets.map((t) => ({
                                timeline: t.timeline,
                                target: t.target.toString(),
                              }));
                              setTargets(tgs);
                              console.log("🔧 Force reloaded targets:", tgs);
                            }
                          }}
                        >
                          Reload Targets
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sync indicator */}
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
                        onValueChange={(val) => {
                          handleTargetChange(index, "timeline", val);
                        }}
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
                        <div>
                          <Label
                            className="sr-only"
                            htmlFor={`target-unit-${index}`}
                          >
                            Unit Type
                          </Label>
                          <Select
                            key={`target-unit-${index}-${kpiId}-${formData.weightType}`}
                            value={formData.weightType}
                            onValueChange={(value: KpiWeightType) =>
                              handleInputChange("weightType", value)
                            }
                            disabled={!canEditTargets}
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
                        {index === 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Note: Uses same unit type as baseline
                          </p>
                        )}
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
