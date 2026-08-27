export interface ScheduleEmployee {
  employeeId: string;
  fullName: string;
  email?: string | null;
  title?: string | null;
  role?: string | null;
}

export interface ScheduleStrategicPeriod {
  strategicPeriodId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface ScheduleStrategicPlan {
  strategicPlanId: string;
  title: string;
  startDate: string;
  endDate: string;
}

export interface ScheduleSession {
  checkinoutSessionId: string;
  title?: string | null;
  weekStartDate: string;
  weekEndDate: string;
  overallStatus: string;
  isLocked?: boolean;
  employee: ScheduleEmployee;
  supervisor?: ScheduleEmployee | null;
  strategicPeriod?: ScheduleStrategicPeriod | null;
}

export interface ScheduleWeekPeriodMetadata {
  annualStrategicPeriodId?: string | null;
  quarterlyStrategicPeriodId?: string | null;
  monthlyStrategicPeriodId?: string | null;
  fiscalYearStartYear?: number | null;
  fiscalYearLabel?: string | null;
  fiscalQuarterNumber?: number | null;
  calendarYear?: number | null;
  calendarMonth?: number | null;
}

export type ScheduleWeekCoverageType = "LEGACY_COVERAGE" | string;

export interface ScheduleWeekCoverage {
  scheduleWeekCoverageId: string;
  coverageType: ScheduleWeekCoverageType;
  employee: ScheduleEmployee;
  existingSession: ScheduleSession;
}

export interface ScheduleWeek extends ScheduleWeekPeriodMetadata {
  scheduleWeekId: string;
  name: string;
  sequence: number;
  /** Legacy backend fallback. */
  quarterNumber?: number | null;
  /** Legacy backend fallback. */
  monthNumber?: number | null;
  weekOfMonth: number;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  activatedAt?: string | null;
  sessions: ScheduleSession[];
  coverages: ScheduleWeekCoverage[];
}

export interface CheckinoutSchedule {
  scheduleId: string;
  title?: string | null;
  rangeStartDate: string;
  rangeEndDate: string;
  status: string;
  strategicPlan?: ScheduleStrategicPlan | null;
  /** Legacy backend fallback. */
  strategicPeriod?: ScheduleStrategicPeriod | null;
  participants: Array<{ employee: ScheduleEmployee }>;
  weeks: ScheduleWeek[];
}

export type ScheduleSessionDisposition =
  | "MISSING"
  | "ADOPTABLE"
  | "COVERED_BY_LEGACY"
  | "PARTIAL_OVERLAP"
  | "CONFLICT"
  | "PERIOD_MISMATCH";

export interface SchedulePreviewSession {
  employeeId: string;
  disposition: ScheduleSessionDisposition;
  existingSessionId?: string | null;
  existingWeekStartDate?: string | null;
  existingWeekEndDate?: string | null;
}

export interface SchedulePreviewWeek extends ScheduleWeekPeriodMetadata {
  sequence: number;
  quarterNumber?: number | null;
  monthNumber?: number | null;
  weekOfMonth: number;
  name: string;
  weekStartDate: string;
  weekEndDate: string;
  sessions: SchedulePreviewSession[];
}

export interface SchedulePreview {
  windowCount: number;
  sessionCount: number;
  missingCount: number;
  adoptableCount: number;
  legacyCoveredCount: number;
  partialOverlapCount: number;
  periodMismatchCount: number;
  conflictCount: number;
  weeks: SchedulePreviewWeek[];
}
