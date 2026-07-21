"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { UPDATE_LOGBOOK_ENTRY } from "@/lib/graphql/mutations/logbook";
import { GET_LOGBOOK_FORMULA_FOR_CONTEXT } from "@/lib/graphql/queries/logbook";
import { getAccessToken } from "@/lib/auth-utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XIcon, PlusIcon, TrashIcon, UploadIcon } from "lucide-react";
import {
  getOrderedLogbookFormulaSources,
  isLogbookFormulaCalculationType,
  type FrontendLogbookItem,
  type LogbookFormulaForContextQueryData,
  type LogbookFormulaForContextQueryVariables,
} from "@/types/logbook";
import { useUser } from "@/stores";

const getApiBaseUrl = () => {
  const graphqlUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:3000/graphql";
  return graphqlUrl.replace(/\/graphql\/?$/, "");
};

const uploadEvidenceFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAccessToken();
  const response = await fetch(`${getApiBaseUrl()}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `File upload failed (${response.status})`);
  }

  const result = await response.json();
  if (typeof result.url === "string" && /^https?:\/\//i.test(result.url)) {
    return result.url;
  }
  if (typeof result.url === "string" && result.url.startsWith("/")) {
    return `${getApiBaseUrl()}${result.url}`;
  }
  return `${getApiBaseUrl()}/storage/${result.filename}`;
};

interface EvidenceItem {
  id: string;
  type: "file" | "email" | "drive_link" | "certificate";
  value: string;
  file?: File;
}

interface SubmitApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FrontendLogbookItem;
  onSuccess: () => void;
}

export function SubmitApprovalDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: SubmitApprovalDialogProps) {
  const currentUser = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState(
    item.description || item.activity || "",
  );
  const [remark, setRemark] = useState(item.outcome || "");
  const isFormulaKpi = isLogbookFormulaCalculationType(
    item.linkedKpi?.calculationType,
  );
  const contextKpiId = item.linkedKpiId ?? item.linkedKpi?.kpiId ?? "";
  const { data: formulaData, loading: formulaLoading } = useQuery<
    LogbookFormulaForContextQueryData,
    LogbookFormulaForContextQueryVariables
  >(GET_LOGBOOK_FORMULA_FOR_CONTEXT, {
    variables: {
      organizationId: currentUser?.organizationId ?? "",
      kpiId: contextKpiId,
      entryDate: item.entryDate.slice(0, 10),
    },
    skip:
      !open || !isFormulaKpi || !contextKpiId || !currentUser?.organizationId,
  });
  const formulaSources = getOrderedLogbookFormulaSources(
    formulaData?.logbookFormulaForContext,
  );
  const hasMetricSources = formulaSources.some(
    (source) => source.sourceType === "METRIC",
  );
  const [quantity, setQuantity] = useState(
    isFormulaKpi || item.kpiAchievedValue == null
      ? ""
      : String(item.kpiAchievedValue),
  );
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([
    { id: "1", type: "email", value: "Enter email date and subject" },
  ]);

  const addEvidenceItem = () => {
    const newItem: EvidenceItem = {
      id: Date.now().toString(),
      type: "file",
      value: "",
    };
    setEvidenceItems([...evidenceItems, newItem]);
  };

  const removeEvidenceItem = (id: string) => {
    setEvidenceItems(evidenceItems.filter((item) => item.id !== id));
  };

  const updateEvidenceItem = <Field extends keyof EvidenceItem>(
    id: string,
    field: Field,
    value: EvidenceItem[Field],
  ) => {
    setEvidenceItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const [updateLogbookEntry] = useMutation(UPDATE_LOGBOOK_ENTRY, {
    refetchQueries: ["GetLogbookEntries"],
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const uploadedEvidence = await Promise.all(
        evidenceItems.map(async (evidence) => {
          if (
            (evidence.type === "file" || evidence.type === "certificate") &&
            evidence.file
          ) {
            const url = await uploadEvidenceFile(evidence.file);
            return { ...evidence, value: url };
          }
          return evidence;
        }),
      );

      const evidenceDescription = uploadedEvidence
        .filter((evidence) => evidence.value?.trim())
        .map((evidence) => `${evidence.type}: ${evidence.value}`)
        .join("\n");

      const parsedQuantity =
        !isFormulaKpi && quantity ? Number(quantity) : null;
      const input: Record<string, unknown> = {
        logbookEntryId: item.id,
        entryStatus: "SUBMITTED",
        evidenceDescription:
          [description.trim(), evidenceDescription]
            .filter(Boolean)
            .join("\n") || null,
        decisionsMade: remark || null,
      };

      if (
        !isFormulaKpi &&
        parsedQuantity !== null &&
        Number.isFinite(parsedQuantity)
      ) {
        input.kpiAchievedValue = parsedQuantity;
      }

      const firstEvidenceUrl = uploadedEvidence.find(
        (evidence) =>
          ["file", "certificate", "drive_link"].includes(evidence.type) &&
          /^https?:\/\//i.test(evidence.value?.trim() || ""),
      )?.value;

      if (firstEvidenceUrl) {
        input.evidenceUrl = firstEvidenceUrl.trim();
      }

      await updateLogbookEntry({
        variables: { input },
      });

      toast.success("Logbook entry submitted for approval");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit for approval",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEvidenceInput = (evidence: EvidenceItem) => {
    switch (evidence.type) {
      case "file":
        return (
          <div className="space-y-2">
            <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-[#3838EC] transition-colors">
              <UploadIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-blue-600">
                Click or drag here to upload file
              </p>
              <p className="text-xs text-gray-500">Upload</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateEvidenceItem(evidence.id, "file", file);
                    updateEvidenceItem(evidence.id, "value", file.name);
                  }
                }}
              />
            </label>
            {evidence.file && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  📄 {evidence.file.name}
                </span>
                <button
                  onClick={() => {
                    updateEvidenceItem(evidence.id, "file", undefined);
                    updateEvidenceItem(evidence.id, "value", "");
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );

      case "email":
        return (
          <Input
            placeholder="Enter email date and subject"
            value={evidence.value}
            onChange={(e) =>
              updateEvidenceItem(evidence.id, "value", e.target.value)
            }
          />
        );

      case "drive_link":
        return (
          <Input
            placeholder="Enter drive link"
            value={evidence.value}
            onChange={(e) =>
              updateEvidenceItem(evidence.id, "value", e.target.value)
            }
          />
        );

      case "certificate":
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  updateEvidenceItem(evidence.id, "file", file);
                  updateEvidenceItem(evidence.id, "value", file.name);
                }
              }}
            />
            {evidence.file && (
              <p className="text-xs text-gray-500">
                Selected: {evidence.file.name}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[800px] xl:max-w-[900px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            Submit for Approval
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Top Row - Description and Remark */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Description of Performance */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description of performance
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Remark */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Remark
              </Label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>

          {/* Bottom Row - Evidence and Quantity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evidence of Performance */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Evidence of Performance
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEvidenceItem}
                  className="flex items-center gap-1 text-[#3838EC] border-[#3838EC] hover:bg-[#3838EC] hover:text-white"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {/* Evidence Items */}
              <div className="space-y-4">
                {evidenceItems.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Evidence of Performance
                      </span>
                      {evidenceItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEvidenceItem(evidence.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Radio buttons */}
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`evidence-${evidence.id}`}
                          value="file"
                          checked={evidence.type === "file"}
                          onChange={(e) =>
                            updateEvidenceItem(
                              evidence.id,
                              "type",
                              e.target.value as EvidenceItem["type"],
                            )
                          }
                          className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          File
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`evidence-${evidence.id}`}
                          value="email"
                          checked={evidence.type === "email"}
                          onChange={(e) =>
                            updateEvidenceItem(
                              evidence.id,
                              "type",
                              e.target.value as EvidenceItem["type"],
                            )
                          }
                          className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Email
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`evidence-${evidence.id}`}
                          value="drive_link"
                          checked={evidence.type === "drive_link"}
                          onChange={(e) =>
                            updateEvidenceItem(
                              evidence.id,
                              "type",
                              e.target.value as EvidenceItem["type"],
                            )
                          }
                          className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Drive Link
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`evidence-${evidence.id}`}
                          value="certificate"
                          checked={evidence.type === "certificate"}
                          onChange={(e) =>
                            updateEvidenceItem(
                              evidence.id,
                              "type",
                              e.target.value as EvidenceItem["type"],
                            )
                          }
                          className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Certificate
                        </span>
                      </label>
                    </div>

                    {/* Dynamic input based on type */}
                    {renderEvidenceInput(evidence)}
                  </div>
                ))}
              </div>
            </div>

            {/* KPI Achievement Value */}
            {isFormulaKpi ? (
              <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div>
                  <Label className="text-sm font-medium text-indigo-950">
                    {item.linkedKpi?.calculationType === "WEIGHTED_INDEX"
                      ? "Weighted-index sources"
                      : "Formula sources"}
                  </Label>
                  <p className="mt-1 text-xs text-indigo-700">
                    Metric observations remain exact decimal strings. KPI-backed
                    values are automatically resolved after approval and are
                    read-only.
                  </p>
                </div>

                {formulaLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading formula sources…
                  </p>
                ) : formulaSources.length > 0 ? (
                  <div className="space-y-2">
                    {formulaSources.map((source) => {
                      const observation =
                        source.sourceType === "METRIC"
                          ? (item.metricObservations || []).find(
                              (candidate) =>
                                candidate.metricDefinitionId ===
                                source.metricDefinitionId,
                            )
                          : undefined;

                      return (
                        <div
                          key={source.key}
                          className="rounded border bg-white px-3 py-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium text-indigo-700">
                                {source.label}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {source.sourceType === "METRIC"
                                  ? source.metricDefinition?.name ||
                                    source.metricDefinitionId
                                  : source.sourceKpi?.name ||
                                    source.sourceKpiId}
                              </p>
                              {source.sourceType === "METRIC" ? (
                                <p className="text-xs text-gray-500">
                                  {source.metricDefinition?.code}
                                  {source.metricDefinition?.unitType
                                    ? ` · ${source.metricDefinition.unitType}`
                                    : ""}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-gray-500">
                                  Automatically resolved from the approved
                                  source KPI result · Read-only
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {source.weight !== undefined && (
                                <p className="font-mono text-xs text-indigo-900">
                                  Weight: {source.weight}%
                                </p>
                              )}
                              {source.sourceType === "METRIC" && (
                                <p
                                  className={`mt-1 font-mono text-sm ${
                                    observation
                                      ? "text-gray-900"
                                      : "text-red-600"
                                  }`}
                                >
                                  {observation?.value ?? "Missing observation"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(item.metricObservations || []).map((observation) => (
                      <div
                        key={observation.id}
                        className="flex items-center justify-between gap-4 rounded border bg-white px-3 py-2"
                      >
                        <span className="text-sm font-medium">
                          {observation.metricDefinition.name}
                        </span>
                        <span className="font-mono text-sm">
                          {observation.value}
                        </span>
                      </div>
                    ))}
                    <p className="text-sm text-gray-600">
                      Approved formula metadata is unavailable.
                    </p>
                  </div>
                )}

                {!formulaLoading &&
                  formulaSources.length > 0 &&
                  !hasMetricSources && (
                    <p className="text-sm text-indigo-800">
                      All sources are KPI-backed; no metric observation is
                      required for submission.
                    </p>
                  )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  KPI Achievement Value
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter achievement value (e.g., 50, 75.5, 100)"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the actual value you achieved for this KPI (not a
                  percentage)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white px-8"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
