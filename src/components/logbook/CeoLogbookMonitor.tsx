"use client";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { GET_LOGBOOK_ENTRIES } from "@/lib/graphql/queries/logbook";
import { useStrategicPeriodStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { AttachmentList } from "@/components/files/AttachmentTrigger";

type Entry = {
  logbookEntryId: string;
  activityDescription: string;
  entryDate: string;
  entryStatus: string;
  evidenceDescription?: string;
  evidenceUrl?: string;
  rejectionReason?: string;
  owner?: { fullName: string };
  linkedKpi?: { name: string };
  evidenceItems?: Array<{
    value: string;
    name?: string;
    mimeType?: string;
    type?: string;
  }>;
};

export function CeoLogbookMonitor() {
  const period = useStrategicPeriodStore((state) => state.selectedPeriod);
  // Remount pagination when the planning period changes.
  return (
    <Monitor
      key={period?.strategicPeriodId || "all"}
      periodId={period?.strategicPeriodId}
    />
  );
}
function Monitor({ periodId }: { periodId?: string }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  const { data, loading, error } = useQuery(GET_LOGBOOK_ENTRIES, {
    variables: {
      page,
      limit: 25,
      strategicPeriodId: periodId,
      entryStatus: status === "ALL" ? undefined : status,
    },
    fetchPolicy: "cache-and-network",
  });
  const entries: Entry[] = data?.logbookEntries?.items || [];
  const meta = data?.logbookEntries?.meta;
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Organization logbook</h1>
        <p className="mt-2 text-muted-foreground">
          Read-only monitoring of recorded work and evidence. Leadership
          approvals have a separate, direct-report inbox.
        </p>
        <Link
          href="/dashboard/approvals?tab=logbook"
          className="mt-3 inline-block font-medium text-primary underline"
        >
          Open leadership approvals
        </Link>
      </header>
      <select
        aria-label="Logbook status"
        className="rounded-md border bg-background p-2"
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setPage(1);
        }}
      >
        {["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"].map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      {loading && <p role="status">Loading logbooks…</p>}
      {error && (
        <p role="alert" className="text-destructive">
          Could not load logbooks: {error.message}
        </p>
      )}
      {!error &&
        entries.map((entry) => (
          <details
            key={entry.logbookEntryId}
            className="rounded-xl border bg-card p-5"
          >
            <summary className="cursor-pointer font-medium">
              {entry.activityDescription}
              <span className="mt-1 block text-sm font-normal text-muted-foreground">
                {entry.owner?.fullName || "Unknown owner"} ·{" "}
                {entry.entryDate?.slice(0, 10)} · {entry.entryStatus}
              </span>
            </summary>
            <div className="mt-4 space-y-3 text-sm">
              <p>{entry.evidenceDescription || "No description recorded."}</p>
              <p>KPI: {entry.linkedKpi?.name || "Not linked"}</p>
              {entry.rejectionReason && (
                <p>Rejection reason: {entry.rejectionReason}</p>
              )}
              <AttachmentList
                items={
                  entry.evidenceItems?.length
                    ? entry.evidenceItems.map((item) => ({
                        url: item.value,
                        name: item.name,
                        mimeType: item.mimeType,
                        evidenceType: item.type,
                      }))
                    : entry.evidenceUrl
                      ? [{ url: entry.evidenceUrl }]
                      : []
                }
              />
            </div>
          </details>
        ))}
      {!loading && !error && entries.length === 0 && (
        <p>No logbooks match this period and status.</p>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {page} · {meta?.totalItems ?? "—"} entries
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={loading || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={loading || !meta || page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </footer>
    </div>
  );
}
