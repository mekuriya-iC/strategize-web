"use client";

import { useEffect, useState } from "react";
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
import {
  AlertCircle,
  XIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import {
  getOrderedLogbookFormulaSources,
  isLogbookFormulaCalculationType,
  logbookFormulaSourceName,
  type FrontendLogbookItem,
  type LogbookEvidenceType,
  type LogbookFormulaForContextQueryData,
  type LogbookFormulaForContextQueryVariables,
} from "@/types/logbook";
import { useUser } from "@/stores";
import {
  getQuarterPlanSubmissionBlock,
  isQuarterPlanSubmissionError,
} from "./logbook-submission-readiness";

const getApiBaseUrl = () => {
  const graphqlUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:3000/graphql";
  return graphqlUrl.replace(/\/graphql\/?$/, "");
};

interface UploadedEvidenceFile {
  url: string;
  filename: string;
  originalname: string;
  size: number;
  type: string;
}

const uploadEvidenceFile = async (
  file: File,
): Promise<UploadedEvidenceFile> => {
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

  const result = (await response.json()) as UploadedEvidenceFile;
  const url =
    typeof result.url === "string" && /^https?:\/\//i.test(result.url)
      ? result.url
      : typeof result.url === "string" && result.url.startsWith("/")
        ? `${getApiBaseUrl()}${result.url}`
        : `${getApiBaseUrl()}/storage/${result.filename}`;

  return { ...result, url };
};

type EvidenceItemType =
  | "file"
  | "image"
  | "link"
  | "email"
  | "certificate";

interface EvidenceItem {
  id: string;
  type: EvidenceItemType;
  value: string;
  file?: File;
  name?: string;
  mimeType?: string;
  size?: number;
}

const API_EVIDENCE_TYPE: Record<EvidenceItemType, LogbookEvidenceType> = {
  file: "FILE",
  image: "IMAGE",
  link: "LINK",
  email: "EMAIL",
  certificate: "CERTIFICATE",
};

const UI_EVIDENCE_TYPE: Record<LogbookEvidenceType, EvidenceItemType> = {
  FILE: "file",
  IMAGE: "image",
  LINK: "link",
  EMAIL: "email",
  CERTIFICATE: "certificate",
};

const createEmptyEvidenceItem = (id = "initial"): EvidenceItem => ({
  id,
  type: "file",
  value: "",
});

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

interface SubmitApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FrontendLogbookItem;
  onSuccess: () => void;
  onEditAchievement?: () => void;
}

export function SubmitApprovalDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
  onEditAchievement,
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
  const quarterPlanSubmissionBlock = getQuarterPlanSubmissionBlock(
    contextKpiId,
    item.quarterPlan,
  );
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

  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([
    createEmptyEvidenceItem(),
  ]);

  useEffect(() => {
    if (!open) return;
    const existingEvidence: EvidenceItem[] = (item.evidenceItems || []).map((evidence) => ({
      id: crypto.randomUUID(),
      type: UI_EVIDENCE_TYPE[evidence.type],
      value: evidence.value,
      name: evidence.name || undefined,
      mimeType: evidence.mimeType || undefined,
      size: evidence.size || undefined,
    }));
    if (existingEvidence.length === 0 && item.attachmentUrl) {
      existingEvidence.push({
        id: crypto.randomUUID(),
        type: "link",
        value: item.attachmentUrl,
        name: "Existing evidence",
      });
    }
    // Dialog-local form state intentionally mirrors the selected draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvidenceItems(
      existingEvidence.length > 0
        ? existingEvidence
        : [createEmptyEvidenceItem()],
    );
  }, [item.attachmentUrl, item.evidenceItems, item.id, open]);

  const addEvidenceItem = () => {
    setEvidenceItems((items) => [
      ...items,
      createEmptyEvidenceItem(crypto.randomUUID()),
    ]);
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

  const changeEvidenceType = (id: string, type: EvidenceItemType) => {
    setEvidenceItems((items) =>
      items.map((item) =>
        item.id === id
          ? { id: item.id, type, value: "" }
          : item,
      ),
    );
  };

  const formulaMetricSources = formulaSources.filter(
    (source) => source.sourceType === "METRIC",
  );
  const hasRecordedKpiResult = !item.linkedKpiId
    ? true
    : isFormulaKpi
      ? !formulaLoading &&
        (formulaMetricSources.length === 0 ||
          formulaMetricSources.every((source) =>
            (item.metricObservations || []).some(
              (observation) =>
                observation.metricDefinitionId === source.metricDefinitionId &&
                String(observation.value).trim() !== "",
            ),
          ))
      : item.kpiAchievedValue != null ||
        Boolean(item.kpiActualNumeratorExact || item.kpiActualRateExact);

  const [updateLogbookEntry] = useMutation(UPDATE_LOGBOOK_ENTRY, {
    refetchQueries: ["GetLogbookEntries"],
  });

  const handleSubmit = async () => {
    if (quarterPlanSubmissionBlock) {
      toast.warning(quarterPlanSubmissionBlock.title, {
        description: quarterPlanSubmissionBlock.description,
        duration: 8000,
      });
      return;
    }

    if (!hasRecordedKpiResult) {
      toast.error(
        "Enter the KPI achievement value or formula observations before submitting.",
      );
      return;
    }

    if (evidenceItems.length === 0) {
      toast.error("Add at least one evidence item before submitting.");
      return;
    }

    const invalidEvidenceIndex = evidenceItems.findIndex((evidence) => {
      if (evidence.type === "email") return !evidence.value.trim();
      if (evidence.type === "link") return !isHttpUrl(evidence.value.trim());
      return !evidence.file && !isHttpUrl(evidence.value.trim());
    });
    if (invalidEvidenceIndex >= 0) {
      toast.error(
        `Complete evidence item ${invalidEvidenceIndex + 1} with a valid file, image, link, certificate, or email reference.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedEvidence = await Promise.all(
        evidenceItems.map(async (evidence) => {
          if (
            ["file", "image", "certificate"].includes(evidence.type) &&
            evidence.file
          ) {
            const uploaded = await uploadEvidenceFile(evidence.file);
            return {
              ...evidence,
              value: uploaded.url,
              name: uploaded.originalname || evidence.file.name,
              mimeType: uploaded.type || evidence.file.type,
              size: uploaded.size || evidence.file.size,
            };
          }
          return evidence;
        }),
      );

      const structuredEvidence = uploadedEvidence.map((evidence) => ({
        type: API_EVIDENCE_TYPE[evidence.type],
        value: evidence.value.trim(),
        name: evidence.name || evidence.file?.name || undefined,
        mimeType: evidence.mimeType || evidence.file?.type || undefined,
        size: evidence.size || evidence.file?.size || undefined,
      }));

      const input: Record<string, unknown> = {
        logbookEntryId: item.id,
        entryStatus: "SUBMITTED",
        evidenceDescription: description.trim() || null,
        evidenceItems: structuredEvidence,
        decisionsMade: remark.trim() || null,
      };

      const firstEvidenceUrl = structuredEvidence.find(
        (evidence) => evidence.type !== "EMAIL" && isHttpUrl(evidence.value),
      )?.value;

      if (firstEvidenceUrl) input.evidenceUrl = firstEvidenceUrl;

      const result = await updateLogbookEntry({
        variables: { input },
        errorPolicy: "none",
      });
      if (!result.data?.updateLogbookEntry) {
        throw new Error("The server did not confirm the logbook submission.");
      }

      toast.success("Logbook entry submitted for approval");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      if (isQuarterPlanSubmissionError(error)) {
        toast.warning("Quarter plan approval required", {
          description:
            "The KPI quarterly target plan changed or is not approved. Refresh the logbook and confirm that the reporting quarter is approved before submitting.",
          duration: 8000,
        });
        return;
      }
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
      case "image":
        return (
          <div className="space-y-2">
            <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-[#3838EC] transition-colors">
              <UploadIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-blue-600">
                Click to upload {evidence.type === "image" ? "an image" : "a file"}
              </p>
              <p className="text-xs text-gray-500">
                Maximum size 10 MB
              </p>
              <input
                type="file"
                accept={
                  evidence.type === "image"
                    ? "image/jpeg,image/png,image/webp"
                    : ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                }
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
            {evidence.file ? (
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {evidence.type === "image" ? "🖼️" : "📄"} {evidence.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    updateEvidenceItem(evidence.id, "file", undefined);
                    updateEvidenceItem(evidence.id, "value", "");
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ) : isHttpUrl(evidence.value) ? (
              <a
                href={evidence.value}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all text-sm text-blue-600 underline"
              >
                {evidence.name || evidence.value}
              </a>
            ) : null}
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

      case "link":
        return (
          <Input
            type="url"
            placeholder="Enter an HTTPS link"
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
            {evidence.file ? (
              <p className="text-xs text-gray-500">
                Selected: {evidence.file.name}
              </p>
            ) : isHttpUrl(evidence.value) ? (
              <a
                href={evidence.value}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all text-xs text-blue-600 underline"
              >
                {evidence.name || evidence.value}
              </a>
            ) : null}
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

          {quarterPlanSubmissionBlock && (
            <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {quarterPlanSubmissionBlock.title}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {quarterPlanSubmissionBlock.description}
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  Your weekly task remains submitted and visible to your supervisor.
                  Only this KPI achievement approval is waiting for the quarterly plan.
                </p>
              </div>
            </div>
          )}

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

                    {/* Evidence type */}
                    <div className="flex flex-wrap gap-4">
                      {(
                        [
                          ["file", "File"],
                          ["image", "Image"],
                          ["link", "Link"],
                          ["email", "Email"],
                          ["certificate", "Certificate"],
                        ] as Array<[EvidenceItemType, string]>
                      ).map(([type, label]) => (
                        <label
                          key={type}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`evidence-${evidence.id}`}
                            value={type}
                            checked={evidence.type === type}
                            onChange={() => changeEvidenceType(evidence.id, type)}
                            className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {label}
                          </span>
                        </label>
                      ))}
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
                                {logbookFormulaSourceName(source)}
                              </p>
                              {source.sourceType === "METRIC" ? (
                                <p className="text-xs text-gray-500">
                                  {source.metricDefinition?.code}
                                  {source.metricDefinition?.unitType
                                    ? ` · ${source.metricDefinition.unitType}`
                                    : ""}
                                </p>
                              ) : source.sourceType === "KPI" ? (
                                <p className="mt-1 text-xs text-gray-500">
                                  Automatically resolved from the approved
                                  source KPI result · Read-only
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-gray-500">
                                  Preview-only exact constant · No observation required
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {source.factorExact !== undefined && (
                                <p className="font-mono text-xs text-indigo-900">
                                  Factor: {source.factorExact}
                                </p>
                              )}
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
                {!hasRecordedKpiResult && (
                  <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-900">
                      Formula observations are missing.
                    </p>
                    <p className="text-xs text-amber-800">
                      Edit this draft and enter every required metric observation
                      before submission.
                    </p>
                    {onEditAchievement && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onEditAchievement}
                      >
                        Enter KPI achievement
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  KPI result submitted with this entry
                </Label>
                {item.kpiActualNumeratorExact || item.kpiActualBasisExact ? (
                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">Numerator</p>
                      <p className="font-mono font-medium">
                        {item.kpiActualNumeratorExact ?? "Derived by server"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Denominator</p>
                      <p className="font-mono font-medium">
                        {item.kpiActualBasisExact ?? "Resolved by server"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Result</p>
                      <p className="font-mono font-medium">
                        {item.kpiActualRateExact ?? "Derived by server"}
                      </p>
                    </div>
                  </div>
                ) : hasRecordedKpiResult ? (
                  <p className="font-medium text-gray-900">
                    {item.kpiAchievedValue}
                  </p>
                ) : (
                  <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
                    <p className="font-medium text-amber-900">
                      No KPI achievement has been recorded.
                    </p>
                    <p className="text-xs text-amber-800">
                      Edit this draft and enter the achieved value, or the numerator
                      and actual denominator required by this KPI.
                    </p>
                    {onEditAchievement && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onEditAchievement}
                      >
                        Enter KPI achievement
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Submission preserves the KPI result components recorded in the
                  logbook editor; evidence submission never replaces them.
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
            disabled={
              isSubmitting ||
              !hasRecordedKpiResult ||
              Boolean(quarterPlanSubmissionBlock)
            }
            title={
              quarterPlanSubmissionBlock?.title ||
              (hasRecordedKpiResult
                ? undefined
                : "Enter the KPI achievement before submitting")
            }
            className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white px-8"
          >
            {isSubmitting ? "Uploading evidence and submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
