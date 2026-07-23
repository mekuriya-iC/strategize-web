"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_LOGBOOK_ENTRY,
  UPDATE_LOGBOOK_ENTRY,
} from "@/lib/graphql/mutations/logbook";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, UploadIcon, XIcon, ClockIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { GET_MY_KPIS } from "@/lib/graphql/queries/kpis";
import {
  GET_KPI_RESULT_ENTRY_CONTEXT,
  GET_LOGBOOK_FORMULA_FOR_CONTEXT,
} from "@/lib/graphql/queries/logbook";
import {
  getOrderedLogbookFormulaSources,
  isLogbookFormulaCalculationType,
  type FrontendLogbookItem,
  type LogbookFormulaForContextQueryData,
  type LogbookFormulaForContextQueryVariables,
  type KpiResultEntryContextQueryData,
  type KpiResultEntryContextQueryVariables,
  type LogbookKpisQueryData,
  type LogbookKpisQueryVariables,
  type LogbookMetricFormulaSource,
} from "@/types/logbook";
import { useStrategicPeriodStore, useUser } from "@/stores";
import { getAccessToken } from "@/lib/auth-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KpiResultInputMode, KpiUnitType } from "@/types/graphql";
import {
  KpiResultEntryFields,
  getResultEntryResolvedBasis,
  isKpiResultEntryValid,
} from "@/components/kpis/KpiResultEntryFields";
import { calculateKpiResultPreview } from "@/utils/basisCalculation";

interface LogbookEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingEntry?: FrontendLogbookItem | null;
}

type TimeValue = { hour: string; minute: string; period: "AM" | "PM" };

const getApiBaseUrl = () => {
  const graphqlUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:3000/graphql";
  return graphqlUrl.replace(/\/graphql\/?$/, "");
};

const uploadLogbookFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAccessToken();
  const response = await fetch(`${getApiBaseUrl()}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    throw new Error("File upload failed");
  }

  const result = await response.json();
  return result.url || `${getApiBaseUrl()}/storage/${result.filename}`;
};

export function LogbookEntryDialog({
  open,
  onOpenChange,
  onSuccess,
  editingEntry,
}: LogbookEntryDialogProps) {
  const currentUser = useUser();
  const selectedPeriod = useStrategicPeriodStore(
    (state) => state.selectedPeriod,
  );

  const { data: kpisData } = useQuery<
    LogbookKpisQueryData,
    LogbookKpisQueryVariables
  >(GET_MY_KPIS, {
    variables: {
      page: 1,
      limit: 200,
      strategicPeriodId: selectedPeriod?.strategicPeriodId,
    },
    skip: !open || !selectedPeriod?.strategicPeriodId,
  });

  const availableKpis = (kpisData?.myKpis?.items || []).filter((kpi) => {
    const mode = kpi.kpiMode || "AGGREGATED";
    const assigneeType = kpi.assigneeType || kpi.objective?.type;

    // Personnel KPIs are loggable by the assigned employee even when the stored mode defaults to AGGREGATED.
    if (assigneeType === "PERSONNEL") return true;

    // Unit-level DIRECT/HYBRID KPIs are loggable by the unit head for retained/direct achievement.
    if (mode === "DIRECT" || mode === "HYBRID") return true;

    // Unit-level AGGREGATED KPIs should be achieved by subordinate child KPIs, not direct manager logs.
    return false;
  });

  // Mutations
  const [createEntryMutation, { loading: creating }] = useMutation(
    CREATE_LOGBOOK_ENTRY,
    {
      refetchQueries: ["GetLogbookEntries"],
    },
  );

  const [updateEntryMutation, { loading: updating }] = useMutation(
    UPDATE_LOGBOOK_ENTRY,
    {
      refetchQueries: ["GetLogbookEntries"],
    },
  );

  const mutationLoading = creating || updating;

  const today = new Date();

  const [entryDate, setEntryDate] = useState<Date>(today);
  const [entryTime, setEntryTime] = useState<TimeValue>({
    hour: "09",
    minute: "00",
    period: "AM",
  });
  const [activity, setActivity] = useState("");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [linkedKpiId, setLinkedKpiId] = useState("");
  const [kpiAchievedValue, setKpiAchievedValue] = useState("");
  const [kpiResultInputMode, setKpiResultInputMode] =
    useState<KpiResultInputMode>("NUMERATOR");
  const [kpiActualNumeratorExact, setKpiActualNumeratorExact] = useState("");
  const [kpiActualRateExact, setKpiActualRateExact] = useState("");
  const [kpiActualBasisExact, setKpiActualBasisExact] = useState("");
  const [kpiTargetValue, setKpiTargetValue] = useState("");
  const [contributionUnit, setContributionUnit] = useState("");
  const [metricObservationValues, setMetricObservationValues] = useState<
    Record<string, string>
  >({});

  const selectedKpi =
    availableKpis.find((kpi) => kpi.kpiId === linkedKpiId) ??
    (editingEntry?.linkedKpi?.kpiId === linkedKpiId
      ? editingEntry.linkedKpi
      : null);
  const isFormulaKpi = isLogbookFormulaCalculationType(
    selectedKpi?.calculationType,
  );
  const isBasisDrivenKpi =
    !isFormulaKpi &&
    (selectedKpi?.calculationBasisSource === "DIRECT_VALUE" ||
      selectedKpi?.calculationBasisSource === "LINKED_KPI");
  const { data: resultContextData, loading: resultContextLoading } = useQuery<
    KpiResultEntryContextQueryData,
    KpiResultEntryContextQueryVariables
  >(GET_KPI_RESULT_ENTRY_CONTEXT, {
    variables: {
      kpiId: linkedKpiId,
      entryDate: format(entryDate, "yyyy-MM-dd"),
    },
    skip: !open || !linkedKpiId || !isBasisDrivenKpi,
    fetchPolicy: "cache-and-network",
  });
  const resultEntryContext = resultContextData?.kpiResultEntryContext;
  const actualBasisSource =
    resultEntryContext?.actualBasisSource ||
    selectedKpi?.actualBasisSource ||
    "USE_APPROVED_BASIS";
  const resolvedBasisExact = getResultEntryResolvedBasis({
    actualBasisSource,
    actualBasisExact: kpiActualBasisExact,
    context: resultEntryContext,
  });
  const resultPreview = calculateKpiResultPreview({
    inputMode: kpiResultInputMode,
    numeratorExact: kpiActualNumeratorExact,
    rateExact: kpiActualRateExact,
    basisExact: resolvedBasisExact,
    unitType: (selectedKpi?.unitType || "PERCENT") as KpiUnitType,
  });
  const { data: formulaData, loading: formulaLoading } = useQuery<
    LogbookFormulaForContextQueryData,
    LogbookFormulaForContextQueryVariables
  >(GET_LOGBOOK_FORMULA_FOR_CONTEXT, {
    variables: {
      organizationId: currentUser?.organizationId ?? "",
      kpiId: linkedKpiId,
      entryDate: format(entryDate, "yyyy-MM-dd"),
    },
    skip:
      !open || !isFormulaKpi || !linkedKpiId || !currentUser?.organizationId,
  });
  const boundFormula = formulaData?.logbookFormulaForContext;
  const formulaSources = getOrderedLogbookFormulaSources(boundFormula);
  const metricSources = formulaSources
    .filter(
      (source): source is LogbookMetricFormulaSource =>
        source.sourceType === "METRIC",
    )
    .filter(
      (source, index, sources) =>
        sources.findIndex(
          (candidate) =>
            candidate.metricDefinitionId === source.metricDefinitionId,
        ) === index,
    );

  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  function resetForm() {
    const newToday = new Date();
    setEntryDate(newToday);
    setEntryTime({ hour: "09", minute: "00", period: "AM" });
    setActivity("");
    setDescription("");
    setOutcome("");
    setAttachment(null);
    setLinkedKpiId("");
    setKpiAchievedValue("");
    setKpiResultInputMode("NUMERATOR");
    setKpiActualNumeratorExact("");
    setKpiActualRateExact("");
    setKpiActualBasisExact("");
    setKpiTargetValue("");
    setContributionUnit("");
    setMetricObservationValues({});
  }

  // Populate form when editing
  useEffect(() => {
    if (editingEntry && open) {
      const entryDateTime = new Date(editingEntry.entryDate);
      // Dialog form state intentionally mirrors the entry selected for editing.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntryDate(entryDateTime);
      setEntryTime({
        hour:
          entryDateTime.getHours() > 12
            ? String(entryDateTime.getHours() - 12).padStart(2, "0")
            : String(entryDateTime.getHours() || 12).padStart(2, "0"),
        minute: String(entryDateTime.getMinutes()).padStart(2, "0"),
        period: entryDateTime.getHours() >= 12 ? "PM" : "AM",
      });
      setActivity(editingEntry.activity || "");
      setDescription(editingEntry.description || "");
      setOutcome(editingEntry.outcome || "");
      setLinkedKpiId(editingEntry.linkedKpiId || "");
      setKpiAchievedValue(
        !isLogbookFormulaCalculationType(
          editingEntry.linkedKpi?.calculationType,
        ) && editingEntry.kpiAchievedValue != null
          ? String(editingEntry.kpiAchievedValue)
          : "",
      );
      setKpiResultInputMode(editingEntry.kpiResultInputMode || "NUMERATOR");
      setKpiActualNumeratorExact(
        editingEntry.kpiActualNumeratorExact ||
          (editingEntry.kpiAchievedValue != null
            ? String(editingEntry.kpiAchievedValue)
            : ""),
      );
      setKpiActualRateExact(editingEntry.kpiActualRateExact || "");
      setKpiActualBasisExact(
        editingEntry.kpiActualBasisExact ||
          (editingEntry.kpiActualDenominator != null
            ? String(editingEntry.kpiActualDenominator)
            : ""),
      );
      setKpiTargetValue(
        editingEntry.kpiTargetValue != null
          ? String(editingEntry.kpiTargetValue)
          : "",
      );
      setContributionUnit(editingEntry.contributionUnit || "");
      setMetricObservationValues(
        Object.fromEntries(
          (editingEntry.metricObservations || []).map((observation) => [
            observation.metricDefinitionId,
            String(observation.value),
          ]),
        ),
      );
    } else if (!open) {
      resetForm();
    }
  }, [editingEntry, open]);

  const buildDateTime = (date: Date, time: TimeValue): Date => {
    const dt = new Date(date);
    let hour = parseInt(time.hour);
    if (time.period === "PM" && hour !== 12) hour += 12;
    if (time.period === "AM" && hour === 12) hour = 0;
    dt.setHours(hour, parseInt(time.minute), 0, 0);
    return dt;
  };

  const handleKpiChange = (value: string) => {
    const nextKpiId = value === "none" ? "" : value;
    setLinkedKpiId(nextKpiId);
    setMetricObservationValues({});
    setKpiResultInputMode("NUMERATOR");
    setKpiActualNumeratorExact("");
    setKpiActualRateExact("");
    setKpiActualBasisExact("");

    const selectedKpi = availableKpis.find(
      (kpi) => kpi.kpiId === nextKpiId,
    );
    if (isLogbookFormulaCalculationType(selectedKpi?.calculationType)) {
      setKpiAchievedValue("");
    }
    if (selectedKpi?.targetValue != null) {
      setKpiTargetValue(String(selectedKpi.targetValue));
    } else if (!nextKpiId) {
      setKpiTargetValue("");
      setKpiAchievedValue("");
      setContributionUnit("");
    }
  };

  const handleSubmit = async () => {
    if (!activity || !entryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!currentUser?.organizationId || !selectedPeriod?.strategicPeriodId) {
      toast.error(
        "Please select a strategic period before adding a logbook entry",
      );
      return;
    }

    const achieved =
      !isFormulaKpi && !isBasisDrivenKpi && kpiAchievedValue
        ? Number(kpiAchievedValue)
        : null;
    const target = kpiTargetValue ? Number(kpiTargetValue) : null;
    const basisAvailable =
      actualBasisSource === "ENTER_ACTUAL_BASIS"
        ? Number(kpiActualBasisExact) > 0
        : Boolean(resultEntryContext?.basisAvailable);

    if (
      linkedKpiId &&
      !isFormulaKpi &&
      !isBasisDrivenKpi &&
      (achieved == null || Number.isNaN(achieved))
    ) {
      toast.error("Please enter the KPI achieved value");
      return;
    }
    if (
      isBasisDrivenKpi &&
      !isKpiResultEntryValid({
        inputMode: kpiResultInputMode,
        numeratorExact: kpiActualNumeratorExact,
        rateExact: kpiActualRateExact,
        resolvedBasisExact,
        basisAvailable,
      })
    ) {
      toast.error(
        resultEntryContext?.message ||
          (actualBasisSource === "LINKED_KPI_ACTUAL"
            ? "The linked KPI actual is not approved or available yet"
            : `Enter a valid ${selectedKpi?.denominatorLabel || "denominator"}`),
      );
      return;
    }
    if (isFormulaKpi) {
      if (formulaLoading || !boundFormula) {
        toast.error("The quarter-bound KPI formula is still loading or unavailable");
        return;
      }
      const invalidSource = metricSources.find((source) => {
        const value =
          metricObservationValues[source.metricDefinitionId] ?? "";
        return !/^-?\d+(?:\.\d+)?$/.test(value);
      });
      if (invalidSource) {
        toast.error(
          `Enter an exact decimal value for ${invalidSource.metricDefinition?.name || invalidSource.label}`,
        );
        return;
      }
    }

    try {
      let evidenceUrl = editingEntry?.attachmentUrl || null;
      if (attachment) {
        evidenceUrl = await uploadLogbookFile(attachment);
      }

      const entryData: Record<string, unknown> = {
        organizationId: currentUser.organizationId,
        strategicPeriodId: selectedPeriod.strategicPeriodId,
        activityDescription: activity.trim(),
        evidenceDescription: description.trim() || null,
        decisionsMade: outcome.trim() || null,
        entryDate: buildDateTime(entryDate, entryTime).toISOString(),
        evidenceUrl,
        linkedKpiId: linkedKpiId || null,
        kpiTargetValue: target,
        contributionUnit: contributionUnit.trim() || null,
        metricObservations: isFormulaKpi
          ? metricSources.map((source) => ({
              metricDefinitionId: source.metricDefinitionId,
              value: metricObservationValues[source.metricDefinitionId],
              observedAt: format(entryDate, "yyyy-MM-dd"),
            }))
          : [],
      };

      if (!isFormulaKpi) {
        const resultForProgress = isBasisDrivenKpi
          ? Number(resultPreview.rateExact)
          : achieved;
        entryData.kpiAchievedValue = isBasisDrivenKpi
          ? Number(resultPreview.numeratorExact)
          : achieved;
        entryData.kpiActualDenominator = isBasisDrivenKpi
          ? Number(resolvedBasisExact)
          : null;
        entryData.kpiResultInputMode = isBasisDrivenKpi
          ? kpiResultInputMode
          : null;
        entryData.kpiActualNumeratorExact = isBasisDrivenKpi
          ? kpiResultInputMode === "NUMERATOR"
            ? kpiActualNumeratorExact
            : null
          : null;
        entryData.kpiActualRateExact = isBasisDrivenKpi
          ? kpiResultInputMode === "RATE_AND_BASIS"
            ? kpiActualRateExact
            : null
          : null;
        entryData.kpiActualBasisExact =
          isBasisDrivenKpi && actualBasisSource === "ENTER_ACTUAL_BASIS"
            ? kpiActualBasisExact
            : null;
        entryData.kpiCompletionPercent =
          resultForProgress != null &&
          Number.isFinite(resultForProgress) &&
          target &&
          target > 0
            ? Number(((resultForProgress / target) * 100).toFixed(2))
            : null;
      }

      if (editingEntry) {
        // Update existing entry
        await updateEntryMutation({
          variables: {
            input: {
              logbookEntryId: editingEntry.id,
              ...entryData,
            },
          },
        });
        toast.success("Logbook entry updated successfully");
      } else {
        // Create new entry
        await createEntryMutation({
          variables: {
            input: entryData,
          },
        });
        toast.success("Logbook entry created successfully");
      }

      onSuccess();
      resetForm();
    } catch (error: unknown) {
      console.error("Logbook entry operation error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${editingEntry ? "update" : "create"} entry`,
      );
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-xl font-semibold">
            {editingEntry ? "Edit Logbook Entry" : "Add Logbook Entry"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] px-6 py-6">
          <div className="space-y-5">
            {/* Entry Date & Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Entry Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 justify-start text-sm font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                      <span className="truncate">
                        {format(entryDate, "MMM d, yyyy")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    style={{ zIndex: 99999 }}
                  >
                    <Calendar
                      mode="single"
                      selected={entryDate}
                      onSelect={(d) => {
                        if (d) {
                          setEntryDate(d);
                          setDateOpen(false);
                        }
                      }}
                      disabled={(d) =>
                        d > new Date() || d < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>

                <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-32 h-10 justify-start text-sm font-normal shrink-0"
                    >
                      <ClockIcon className="mr-1.5 h-4 w-4 text-gray-500 shrink-0" />
                      <span className="tabular-nums text-xs">
                        {entryTime.hour}:{entryTime.minute} {entryTime.period}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    style={{ zIndex: 99999 }}
                  >
                    <TimePicker
                      value={entryTime}
                      onChange={setEntryTime}
                      onClose={() => setTimeOpen(false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-2">
              <Label
                htmlFor="activity"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Activity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="activity"
                placeholder="Enter activity title..."
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </Label>
              <Textarea
                placeholder="Describe what you did..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] text-sm resize-none"
              />
            </div>

            {/* Outcome */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Outcome/Result
              </Label>
              <Textarea
                placeholder="What was the outcome or result..."
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="min-h-[100px] text-sm resize-none"
              />
            </div>

            {/* KPI Achievement */}
            <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  KPI Achievement (Optional)
                </Label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Link this entry to a KPI so approved achievements count toward
                  KPI scorecards.
                </p>
              </div>

              <Select
                value={linkedKpiId || "none"}
                onValueChange={handleKpiChange}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select KPI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No KPI linked</SelectItem>
                  {availableKpis.map((kpi) => {
                    const mode = kpi.kpiMode || "AGGREGATED";
                    const suffix =
                      mode === "HYBRID"
                        ? ` · HYBRID ${Number(kpi.managerRetentionPercent || 0).toFixed(0)}% manager`
                        : mode === "DIRECT"
                          ? " · DIRECT"
                          : "";

                    return (
                      <SelectItem key={kpi.kpiId} value={kpi.kpiId}>
                        {kpi.name}
                        {suffix}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {linkedKpiId && isFormulaKpi ? (
                <div className="space-y-4 rounded-md border border-indigo-200 bg-indigo-50/50 p-4">
                  <div>
                    <p className="text-sm font-medium text-indigo-950">
                      {selectedKpi?.calculationType === "WEIGHTED_INDEX"
                        ? "Weighted-index components"
                        : "Exact formula observations"}
                    </p>
                    <p className="mt-1 text-xs text-indigo-700">
                      Metric sources accept exact decimal observations. KPI
                      sources are resolved automatically after approval, and no
                      scalar achieved value is submitted for this formula KPI.
                    </p>
                  </div>
                  {formulaLoading ? (
                    <p className="text-sm text-gray-500">Loading formula…</p>
                  ) : boundFormula ? (
                    <div className="space-y-3">
                      {formulaSources.map((source) => (
                        <div
                          key={source.key}
                          className="space-y-3 rounded border bg-white px-3 py-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium text-indigo-800">
                                {source.label}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {source.sourceType === "METRIC"
                                  ? source.metricDefinition?.name ||
                                    source.metricDefinitionId
                                  : source.sourceKpi?.name || source.sourceKpiId}
                              </p>
                            </div>
                            {source.weight !== undefined && (
                              <span className="rounded bg-indigo-100 px-2 py-1 font-mono text-xs text-indigo-900">
                                Weight: {source.weight}%
                              </span>
                            )}
                          </div>

                          {source.sourceType === "METRIC" ? (
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-700">
                                Observed metric value
                              </Label>
                              <Input
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                value={
                                  metricObservationValues[
                                    source.metricDefinitionId
                                  ] || ""
                                }
                                onChange={(event) =>
                                  setMetricObservationValues((current) => ({
                                    ...current,
                                    [source.metricDefinitionId]:
                                      event.target.value,
                                  }))
                                }
                                placeholder="Exact decimal value"
                                className="h-10 bg-white font-mono text-sm"
                              />
                              <p className="text-[11px] text-gray-500">
                                {source.metricDefinition?.code}
                                {source.metricDefinition?.unitType
                                  ? ` · ${source.metricDefinition.unitType}`
                                  : ""}
                              </p>
                            </div>
                          ) : (
                            <div className="rounded border border-dashed bg-gray-50 px-3 py-2 text-xs text-gray-600">
                              Automatically resolved from the approved source KPI
                              result. Read-only; no observation is required.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">
                      No formula definition is bound to this KPI quarter.
                    </p>
                  )}
                </div>
              ) : linkedKpiId ? (
                <div className="space-y-3">
                  {isBasisDrivenKpi ? (
                    <KpiResultEntryFields
                      unitType={(selectedKpi?.unitType || "PERCENT") as KpiUnitType}
                      inputMode={kpiResultInputMode}
                      onInputModeChange={setKpiResultInputMode}
                      numeratorExact={kpiActualNumeratorExact}
                      onNumeratorExactChange={setKpiActualNumeratorExact}
                      rateExact={kpiActualRateExact}
                      onRateExactChange={setKpiActualRateExact}
                      actualBasisExact={kpiActualBasisExact}
                      onActualBasisExactChange={setKpiActualBasisExact}
                      context={resultEntryContext}
                      contextLoading={resultContextLoading}
                      fallbackActualBasisSource={selectedKpi?.actualBasisSource}
                      fallbackNumeratorLabel={selectedKpi?.numeratorLabel}
                      fallbackDenominatorLabel={selectedKpi?.denominatorLabel}
                      fallbackBasisUnitType={selectedKpi?.basisUnitType}
                    />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Achieved Value
                        </Label>
                        <FormattedNumberInput
                          step="any"
                          min="0"
                          value={kpiAchievedValue}
                          onValueChange={setKpiAchievedValue}
                          currency={selectedKpi?.unitType === "CURRENCY"}
                          placeholder="0"
                          className="h-10 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Target Value
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={kpiTargetValue}
                          onChange={(e) => setKpiTargetValue(e.target.value)}
                          placeholder="Target"
                          className="h-10 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Unit
                        </Label>
                        <Input
                          value={contributionUnit}
                          onChange={(e) => setContributionUnit(e.target.value)}
                          placeholder="%, ETB, tasks..."
                          className="h-10 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Attachment (Optional)
              </Label>
              <label
                htmlFor="file-upload-logbook"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition-colors",
                  "border-2 border-dashed border-gray-300 dark:border-gray-600",
                  "hover:border-[#3838EC] hover:bg-blue-50/30 dark:hover:bg-blue-950/10",
                )}
              >
                <input
                  id="file-upload-logbook"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setAttachment(e.target.files[0]);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <UploadIcon className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Click or drag here to upload
                </span>
              </label>
              {attachment && (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                    {attachment.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-red-400 hover:text-red-600 shrink-0"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutationLoading}
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutationLoading}
            className="sm:w-auto bg-[#3838EC] hover:bg-[#2d2dbd] text-white"
          >
            {mutationLoading
              ? editingEntry
                ? "Updating..."
                : "Adding..."
              : editingEntry
                ? "Update Entry"
                : "Add Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
