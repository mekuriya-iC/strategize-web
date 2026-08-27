"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CalendarRange, ChevronDown, ChevronRight, Play, Plus, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  ACTIVATE_CHECKINOUT_SCHEDULE_WEEK,
  GET_CHECKINOUT_SCHEDULES,
} from "@/lib/graphql/checkinout-schedules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { classifyScheduleWeek, formatDateOnly, groupScheduleWeeks } from "@/utils/checkin-schedule-groups";
import { GenerateScheduleDialog } from "./GenerateScheduleDialog";
import type { CheckinoutSchedule, ScheduleWeek } from "./schedule-types";

interface ScheduleCalendarProps {
  currentUser?: { employeeId?: string; role?: string } | null;
  onSelectSession: (sessionId: string) => void;
}

type CalendarView = "current" | "upcoming" | "history";

export function ScheduleCalendar({ currentUser, onSelectSession }: ScheduleCalendarProps) {
  const [view, setView] = useState<CalendarView>("current");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const { data, loading, error, refetch } = useQuery(GET_CHECKINOUT_SCHEDULES, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
  });
  const [activate, { loading: activating }] = useMutation(ACTIVATE_CHECKINOUT_SCHEDULE_WEEK);
  const visibleSchedules = useMemo(
    () => ((data?.checkinoutSchedules ?? []) as CheckinoutSchedule[]).map((schedule) => ({
      ...schedule,
      weeks: schedule.weeks.filter((week) => classifyScheduleWeek(week) === view),
    })).filter((schedule) => schedule.weeks.length > 0),
    [data, view],
  );

  const toggleGroup = (key: string) => setOpenGroups((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  const selectScheduledSession = (week: ScheduleWeek, sessionId: string, employeeId: string, status: string) => {
    if (employeeId !== currentUser?.employeeId && (week.status === "DRAFT" || status === "DRAFT")) {
      toast.info("Future week details are private until the employee submits their plan.");
      return;
    }
    onSelectSession(sessionId);
  };

  const activateWeek = async (weekId: string) => {
    try {
      await activate({ variables: { scheduleWeekId: weekId } });
      toast.success("Schedule week activated.");
      await refetch();
    } catch (activationError: unknown) {
      toast.error(activationError instanceof Error ? activationError.message : "Could not activate this week.");
    }
  };

  return (
    <section className="mb-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="flex items-center gap-2 text-lg font-bold"><CalendarRange className="h-5 w-5 text-[#3838EC]" />Schedule calendar</h2><p className="mt-1 text-sm text-muted-foreground">Planned check-in/out weeks. Future draft tasks remain private to each employee.</p></div>
        {isSuperAdmin && <Button onClick={() => setGenerateOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Generate schedule</Button>}
      </div>
      <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)} className="mt-5">
        <TabsList><TabsTrigger value="current">Current</TabsTrigger><TabsTrigger value="upcoming">Upcoming</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
      </Tabs>

      <div className="mt-4 space-y-4">
        {loading && !data && <p className="py-8 text-center text-sm text-muted-foreground">Loading schedule...</p>}
        {error && !data && <p className="py-8 text-center text-sm text-muted-foreground">Schedules are not available yet. Legacy sessions remain available below.</p>}
        {!loading && !error && visibleSchedules.length === 0 && <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">No {view} scheduled weeks.</p>}
        {visibleSchedules.map((schedule) => (
          <div key={schedule.scheduleId} className="rounded-xl border">
            <div className="flex flex-col gap-2 border-b bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">{schedule.title || schedule.strategicPlan?.title || schedule.strategicPeriod?.name || "Check-in/out schedule"}</h3><p className="text-xs text-muted-foreground">{formatDateOnly(schedule.rangeStartDate)} – {formatDateOnly(schedule.rangeEndDate)} · {schedule.participants.length} participants</p></div><Badge variant="outline">{schedule.status}</Badge></div>
            <div className="space-y-3 p-3">
              {groupScheduleWeeks(schedule.weeks).map((fiscalYear) => {
                const yearKey = `${schedule.scheduleId}-${fiscalYear.key}`;
                return <div key={fiscalYear.key}>
                  <button type="button" onClick={() => toggleGroup(yearKey)} className="flex w-full items-center gap-2 rounded-md p-2 text-left font-semibold hover:bg-muted/50">{openGroups.has(yearKey) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{fiscalYear.label}</button>
                  {openGroups.has(yearKey) && <div className="ml-3 space-y-2 border-l pl-3">{fiscalYear.quarters.map((quarter) => <div key={quarter.key}><p className="py-2 text-sm font-semibold">{quarter.label}</p><div className="ml-3 space-y-2 border-l pl-3">{quarter.months.map((month) => <div key={month.key}><p className="py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{month.label}</p><div className="grid gap-2 lg:grid-cols-2">{month.weeks.map((week) => <div key={week.scheduleWeekId} className="rounded-lg border p-3 hover:border-[#3838EC]/40"><div className="flex items-center justify-between gap-3"><div className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{week.name}</span><span className="block text-xs text-muted-foreground">{formatDateOnly(week.weekStartDate)} – {formatDateOnly(week.weekEndDate)} · {week.sessions.length + (week.coverages?.length ?? 0)} participants ({week.sessions.length} scheduled, {week.coverages?.length ?? 0} legacy covered)</span></div><div className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{week.status}</Badge>{isSuperAdmin && week.status === "DRAFT" && view !== "history" && <Button size="sm" variant="outline" className="gap-1" disabled={activating} onClick={() => activateWeek(week.scheduleWeekId)}><Play className="h-3 w-3" />Activate</Button>}{week.status === "OPEN" && <ShieldCheck className="h-4 w-4 text-green-600" />}</div></div><div className="mt-2 space-y-1 border-t pt-2">{week.sessions.map((session) => <button key={session.checkinoutSessionId} type="button" onClick={() => selectScheduledSession(week, session.checkinoutSessionId, session.employee.employeeId, session.overallStatus)} className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted"><span className="flex min-w-0 items-center gap-2"><UserRound className="h-3 w-3 shrink-0"/><span className="truncate">{session.employee.fullName}</span></span><span className="text-muted-foreground">{session.overallStatus}</span></button>)}{(week.coverages ?? []).map((coverage) => <button key={coverage.scheduleWeekCoverageId} type="button" onClick={() => onSelectSession(coverage.existingSession.checkinoutSessionId)} className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted"><span className="flex min-w-0 items-center gap-2"><ShieldCheck className="h-3 w-3 shrink-0 text-green-600"/><span className="truncate">{coverage.employee.fullName}</span></span><span className="text-muted-foreground">Legacy · {formatDateOnly(coverage.existingSession.weekStartDate)}–{formatDateOnly(coverage.existingSession.weekEndDate)}</span></button>)}</div></div>)}</div></div>)}</div></div>)}</div>}
                </div>;
              })}
            </div>
          </div>
        ))}
      </div>
      {isSuperAdmin && <GenerateScheduleDialog open={generateOpen} onOpenChange={setGenerateOpen} onGenerated={async () => { await refetch(); }} />}
    </section>
  );
}
