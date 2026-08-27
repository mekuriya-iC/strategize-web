"use client";

import { useMemo, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { AlertTriangle, CalendarDays, Check, Users } from "lucide-react";
import { toast } from "sonner";
import { GET_SUPER_ADMIN_CHECKINOUT_SESSION_CANDIDATES } from "@/lib/graphql/queries/checkins";
import { GENERATE_CHECKINOUT_SCHEDULE, PREVIEW_CHECKINOUT_SCHEDULE } from "@/lib/graphql/checkinout-schedules";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { firstMondayOnOrAfter, formatDateOnly, isMonday, isSchedulePreviewBlocker, schedulePreviewReason } from "@/utils/checkin-schedule-groups";
import type { ScheduleEmployee, SchedulePreview } from "./schedule-types";

interface GenerateScheduleDialogProps { open: boolean; onOpenChange: (open: boolean) => void; onGenerated: () => void | Promise<void>; }
type Step = "details" | "participants" | "preview";
type RangeMode = "entire" | "fiscal-years" | "custom";

export function GenerateScheduleDialog({ open, onOpenChange, onGenerated }: GenerateScheduleDialogProps) {
  const [step, setStep] = useState<Step>("details");
  const [title, setTitle] = useState("");
  const [rangeMode, setRangeMode] = useState<RangeMode>("entire");
  const [rangeStartDate, setRangeStartDate] = useState("");
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [selectedAnnualIds, setSelectedAnnualIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<"hierarchy" | "custom">("hierarchy");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { activeStrategicPlan, strategicPeriods, loading: periodsLoading } = useActiveStrategicPlanPeriods();
  const annualPeriods = useMemo(() => strategicPeriods.filter((period) => period.periodType?.toUpperCase() === "ANNUAL").sort((a, b) => a.startDate.localeCompare(b.startDate)), [strategicPeriods]);
  const selectedAnnualPeriods = annualPeriods.filter((period) => selectedAnnualIds.has(period.strategicPeriodId));
  const selectedFiscalYearsContiguous = selectedAnnualPeriods.every(
    (period, selectedIndex) =>
      selectedIndex === 0 ||
      annualPeriods.findIndex(
        (candidate) => candidate.strategicPeriodId === period.strategicPeriodId,
      ) ===
        annualPeriods.findIndex(
          (candidate) =>
            candidate.strategicPeriodId ===
            selectedAnnualPeriods[selectedIndex - 1].strategicPeriodId,
        ) +
          1,
  );
  const computedRange = rangeMode === "entire" && activeStrategicPlan
    ? { start: firstMondayOnOrAfter(activeStrategicPlan.startDate), end: activeStrategicPlan.endDate.slice(0, 10) }
    : rangeMode === "fiscal-years" && selectedAnnualPeriods.length
      ? { start: firstMondayOnOrAfter(selectedAnnualPeriods[0].startDate), end: selectedAnnualPeriods[selectedAnnualPeriods.length - 1].endDate.slice(0, 10) }
      : { start: rangeStartDate, end: rangeEndDate };

  const { data: candidatesData, loading: candidatesLoading } = useQuery(GET_SUPER_ADMIN_CHECKINOUT_SESSION_CANDIDATES, { skip: !open });
  const candidates = useMemo<ScheduleEmployee[]>(() => (candidatesData?.superAdminCheckinoutSessionCandidates ?? []).filter((candidate: ScheduleEmployee & { status?: string }) => candidate.status !== "INACTIVE"), [candidatesData]);
  const [loadPreview, { data: previewData, loading: previewLoading }] = useLazyQuery(PREVIEW_CHECKINOUT_SCHEDULE, { fetchPolicy: "network-only" });
  const [generate, { loading: generating }] = useMutation(GENERATE_CHECKINOUT_SCHEDULE, {
    refetchQueries: ["CheckinoutSchedules"],
  });
  const preview = previewData?.previewCheckinoutSchedule as SchedulePreview | undefined;
  const candidatesById = useMemo(() => new Map(candidates.map((candidate) => [candidate.employeeId, candidate])), [candidates]);
  const blockers = useMemo(() => preview?.weeks.flatMap((week) => week.sessions.filter((session) => isSchedulePreviewBlocker(session.disposition)).map((session) => ({ employee: candidatesById.get(session.employeeId), week, session }))) ?? [], [candidatesById, preview]);
  const mismatchCount = blockers.filter(({ session }) => session.disposition === "PERIOD_MISMATCH").length;
  const participantIds = selectionMode === "hierarchy" ? candidates.map((candidate) => candidate.employeeId) : [...selectedIds];
  const input = { ...(title.trim() ? { title: title.trim() } : {}), strategicPlanId: activeStrategicPlan?.strategicPlanId ?? "", rangeStartDate: computedRange.start, rangeEndDate: computedRange.end, participantEmployeeIds: participantIds };
  const customMondayValid = rangeMode !== "custom" || !computedRange.start || isMonday(computedRange.start);
  const detailsValid = Boolean(activeStrategicPlan && computedRange.start && computedRange.end && computedRange.start <= computedRange.end && customMondayValid && (rangeMode !== "fiscal-years" || (selectedAnnualPeriods.length && selectedFiscalYearsContiguous)));

  const previewSchedule = async () => { try { await loadPreview({ variables: { input } }); setStep("preview"); } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Could not preview this schedule."); } };
  const generateSchedule = async () => { try { await generate({ variables: { input } }); toast.success("Schedule generated successfully."); await onGenerated(); onOpenChange(false); setStep("details"); } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Could not generate this schedule."); } };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader><DialogTitle>Generate check-in/out schedule</DialogTitle><DialogDescription>{step === "details" ? "Choose a range within the active strategic plan." : step === "participants" ? "Use the reporting hierarchy or customize participants." : "Review every week and resolve blocking dispositions before generating."}</DialogDescription></DialogHeader>
    <div className="flex gap-2">{(["details", "participants", "preview"] as Step[]).map((item, index) => <Badge key={item} variant={step === item ? "default" : "outline"} className="capitalize">{index + 1}. {item}</Badge>)}</div>
    {step === "details" && <div className="grid gap-5 py-2">
      <div className="space-y-2"><Label htmlFor="schedule-title">Title (optional)</Label><Input id="schedule-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Multi-year weekly check-ins" /></div>
      <div className="rounded-lg border p-3"><p className="text-sm font-semibold">{periodsLoading ? "Loading active strategic plan…" : activeStrategicPlan?.title || "No active strategic plan"}</p>{activeStrategicPlan && <p className="text-xs text-muted-foreground">{formatDateOnly(activeStrategicPlan.startDate)} – {formatDateOnly(activeStrategicPlan.endDate)}</p>}</div>
      <div className="space-y-2"><Label>Range</Label><Select value={rangeMode} onValueChange={(value) => setRangeMode(value as RangeMode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="entire">Entire plan</SelectItem><SelectItem value="fiscal-years">Selected fiscal years</SelectItem><SelectItem value="custom">Custom range</SelectItem></SelectContent></Select></div>
      {rangeMode === "fiscal-years" && <div className="space-y-2 rounded-lg border p-3">{annualPeriods.map((period) => <label key={period.strategicPeriodId} className="flex items-center gap-3 rounded p-2 hover:bg-muted/50"><Checkbox checked={selectedAnnualIds.has(period.strategicPeriodId)} onCheckedChange={(checked) => setSelectedAnnualIds((current) => { const next = new Set(current); if (checked) next.add(period.strategicPeriodId); else next.delete(period.strategicPeriodId); return next; })} /><span><span className="block text-sm font-medium">{period.name}</span><span className="block text-xs text-muted-foreground">{formatDateOnly(period.startDate)} – {formatDateOnly(period.endDate)}</span></span></label>)}{!periodsLoading && !annualPeriods.length && <p className="text-sm text-muted-foreground">No annual periods are available for this plan.</p>}</div>}
      {rangeMode === "custom" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="range-start">Start date (Monday)</Label><Input id="range-start" type="date" value={rangeStartDate} onChange={(event) => setRangeStartDate(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="range-end">End date</Label><Input id="range-end" type="date" value={rangeEndDate} onChange={(event) => setRangeEndDate(event.target.value)} /></div></div>}
      {computedRange.start && computedRange.end && <p className="text-sm text-muted-foreground">Schedule range: {formatDateOnly(computedRange.start)} – {formatDateOnly(computedRange.end)}</p>}
      {rangeMode === "fiscal-years" && selectedAnnualPeriods.length > 1 && !selectedFiscalYearsContiguous && <p className="text-sm text-red-600">Selected fiscal years must be consecutive.</p>}
      {!customMondayValid && <p className="text-sm text-red-600">Custom range start date must be a Monday.</p>}{computedRange.start && computedRange.end && computedRange.start > computedRange.end && <p className="text-sm text-red-600">End date must be on or after start date.</p>}
    </div>}
    {step === "participants" && <div className="space-y-4 py-2"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><button type="button" onClick={() => setSelectionMode("hierarchy")} className={`rounded-lg border p-4 text-left ${selectionMode === "hierarchy" ? "border-[#3838EC] bg-[#3838EC]/5" : "border-border"}`}><Users className="mb-2 h-5 w-5 text-[#3838EC]"/><span className="font-semibold">Reporting hierarchy</span></button><button type="button" onClick={() => setSelectionMode("custom")} className={`rounded-lg border p-4 text-left ${selectionMode === "custom" ? "border-[#3838EC] bg-[#3838EC]/5" : "border-border"}`}><Check className="mb-2 h-5 w-5 text-[#3838EC]"/><span className="font-semibold">Customize</span></button></div><p className="text-sm font-medium">{participantIds.length} of {candidates.length} participants selected</p><div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-2">{candidatesLoading ? <p className="p-3 text-sm text-muted-foreground">Loading candidates...</p> : candidates.map((candidate) => <label key={candidate.employeeId} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50"><Checkbox disabled={selectionMode === "hierarchy"} checked={selectionMode === "hierarchy" || selectedIds.has(candidate.employeeId)} onCheckedChange={(checked) => setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(candidate.employeeId); else next.delete(candidate.employeeId); return next; })}/><span className="min-w-0"><span className="block truncate text-sm font-medium">{candidate.fullName}</span><span className="block truncate text-xs text-muted-foreground">{candidate.title || candidate.email || candidate.role}</span></span></label>)}</div></div>}
    {step === "preview" && <div className="space-y-4 py-2">{previewLoading && <p className="text-sm text-muted-foreground">Building preview...</p>}{preview && <><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[["New Drafts", preview.missingCount], ["Exact Adoptions", preview.adoptableCount], ["Legacy Covered", preview.legacyCoveredCount], ["Partial Overlaps", preview.partialOverlapCount], ["Conflicts", preview.conflictCount], ["Mismatches", mismatchCount]].map(([label, value]) => <div key={String(label)} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div>)}</div><div className="max-h-40 overflow-y-auto rounded-lg border p-3"><div className="space-y-2">{preview.weeks.map((week) => <div key={`${week.sequence}-${week.weekStartDate}`} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground"/>{week.fiscalYearLabel ? `${week.fiscalYearLabel} · FQ${week.fiscalQuarterNumber} · ` : ""}{week.name}</span><span className="text-muted-foreground">{formatDateOnly(week.weekStartDate)} – {formatDateOnly(week.weekEndDate)}</span></div>)}</div></div>{blockers.length > 0 && <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/20"><h3 className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200"><AlertTriangle className="h-4 w-4"/>Schedule blockers</h3><div className="mt-3 space-y-2">{blockers.map((blocker, index) => <div key={`${blocker.session.employeeId}-${blocker.week.weekStartDate}-${index}`} className="text-sm"><Badge variant="outline" className="mr-2">{blocker.session.disposition}</Badge><span className="font-medium">{blocker.employee?.fullName || "Selected employee"}</span> · {formatDateOnly(blocker.week.weekStartDate)}–{formatDateOnly(blocker.week.weekEndDate)}{blocker.session.existingWeekStartDate && blocker.session.existingWeekEndDate && <span className="text-muted-foreground"> — existing {formatDateOnly(blocker.session.existingWeekStartDate)}–{formatDateOnly(blocker.session.existingWeekEndDate)}</span>}<span className="block pl-2 text-xs text-muted-foreground">{schedulePreviewReason(blocker.session)}</span></div>)}</div></div>}</>}</div>}
    <DialogFooter>{step !== "details" && <Button variant="outline" onClick={() => setStep(step === "preview" ? "participants" : "details")} disabled={generating}>Back</Button>}{step === "details" && <Button onClick={() => setStep("participants")} disabled={!detailsValid}>Continue</Button>}{step === "participants" && <Button onClick={previewSchedule} disabled={!participantIds.length || previewLoading}>{previewLoading ? "Previewing..." : "Preview schedule"}</Button>}{step === "preview" && <Button onClick={generateSchedule} disabled={!preview || blockers.length > 0 || generating}>{generating ? "Generating..." : blockers.length ? "Resolve blockers first" : "Generate schedule"}</Button>}</DialogFooter>
  </DialogContent></Dialog>;
}
