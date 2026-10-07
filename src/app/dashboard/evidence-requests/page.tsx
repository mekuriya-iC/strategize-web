"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CheckCircle2, FileCheck2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { GET_EVIDENCE_APPROVAL_INBOX } from "@/lib/graphql/queries/logbook";
import { REVIEW_LOGBOOK_EVIDENCE } from "@/lib/graphql/mutations/logbook";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AttachmentList } from "@/components/files/AttachmentTrigger";

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

interface EvidenceRequest {
  logbookEvidenceApprovalId: string;
  revision: number;
  status: ReviewStatus;
  rejectionReason?: string | null;
  evidenceDescriptionSnapshot?: string | null;
  evidenceUrlSnapshot?: string | null;
  evidenceItemsSnapshot: Array<{
    type: string;
    value: string;
    name?: string | null;
    mimeType?: string | null;
  }>;
  submittedAt: string;
  submittedBy: { fullName: string; title?: string | null };
  logbookEntry: {
    logbookEntryId: string;
    entryDate: string;
    activityDescription: string;
    decisionsMade?: string | null;
    linkedKpi?: { name: string } | null;
    owner: { fullName: string; email: string; title?: string | null };
  };
}

export default function EvidenceRequestsPage() {
  const [status, setStatus] = useState<ReviewStatus>("PENDING");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const { data, loading, error, refetch } = useQuery(
    GET_EVIDENCE_APPROVAL_INBOX,
    {
      variables: { page: 1, limit: 100, status },
      fetchPolicy: "cache-and-network",
    },
  );
  const [reviewEvidence, { loading: reviewing }] = useMutation(
    REVIEW_LOGBOOK_EVIDENCE,
  );

  const requests = (data?.evidenceApprovalInbox?.items || []) as EvidenceRequest[];

  const decide = async (request: EvidenceRequest, decision: "APPROVED" | "REJECTED") => {
    const rejectionReason = rejectionReasons[request.logbookEvidenceApprovalId]?.trim();
    if (decision === "REJECTED" && !rejectionReason) {
      toast.error("Enter a clear correction reason before rejecting the evidence.");
      return;
    }
    try {
      await reviewEvidence({
        variables: {
          input: {
            logbookEvidenceApprovalId: request.logbookEvidenceApprovalId,
            decision,
            rejectionReason: decision === "REJECTED" ? rejectionReason : undefined,
          },
        },
      });
      toast.success(
        decision === "APPROVED"
          ? "Evidence approved and forwarded for final approval"
          : "Evidence returned to the owner for correction",
      );
      await refetch();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Could not update the evidence request.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Evidence requests</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Verify source evidence before a logbook entry reaches its final hierarchy approver.
          </p>
        </div>
        <div className="flex rounded-lg border bg-white p-1">
          {(["PENDING", "APPROVED", "REJECTED"] as ReviewStatus[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                status === item
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.charAt(0) + item.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex min-h-48 items-center justify-center text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading evidence requests…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error.message}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-12 text-center">
          <FileCheck2 className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-700">No {status.toLowerCase()} evidence requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.logbookEvidenceApprovalId}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {request.logbookEntry.activityDescription}
                    </h2>
                    <Badge variant="outline">Revision {request.revision}</Badge>
                    <Badge
                      className={
                        request.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : request.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {request.logbookEntry.owner.fullName} · {request.logbookEntry.owner.title || "Employee"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Submitted {new Date(request.submittedAt).toLocaleString()}
                    {request.logbookEntry.linkedKpi?.name
                      ? ` · KPI: ${request.logbookEntry.linkedKpi.name}`
                      : ""}
                  </p>
                </div>
              </div>

              {request.evidenceDescriptionSnapshot && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Evidence description
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                    {request.evidenceDescriptionSnapshot}
                  </p>
                </div>
              )}

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Source evidence
                </p>
                <AttachmentList
                  items={
                    request.evidenceItemsSnapshot.length
                      ? request.evidenceItemsSnapshot.map((evidence) => ({
                          url: evidence.value,
                          name: evidence.name || undefined,
                          mimeType: evidence.mimeType || undefined,
                          evidenceType: evidence.type,
                        }))
                      : request.evidenceUrlSnapshot
                        ? [{ url: request.evidenceUrlSnapshot }]
                        : []
                  }
                />
              </div>

              {request.status === "PENDING" && (
                <div className="mt-5 space-y-3 border-t pt-4">
                  <Textarea
                    placeholder="Correction reason (required only when rejecting)"
                    value={rejectionReasons[request.logbookEvidenceApprovalId] || ""}
                    onChange={(event) =>
                      setRejectionReasons((current) => ({
                        ...current,
                        [request.logbookEvidenceApprovalId]: event.target.value,
                      }))
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      disabled={reviewing}
                      onClick={() => void decide(request, "REJECTED")}
                      className="text-red-700"
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reject evidence
                    </Button>
                    <Button
                      disabled={reviewing}
                      onClick={() => void decide(request, "APPROVED")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve evidence
                    </Button>
                  </div>
                </div>
              )}

              {request.status === "REJECTED" && request.rejectionReason && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {request.rejectionReason}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
