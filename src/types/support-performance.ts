export type SupportPerformanceScope =
  | "SELF"
  | "DEPARTMENT"
  | "DIVISION"
  | "ORGANIZATION"
  | string;

export interface SupportReadinessSummary {
  totalAssignments: number;
  noLocalKpi: number;
  planningIncomplete: number;
  pendingApproval: number;
  ready: number;
}

export interface SupportQuarterOutcome {
  quarterNumber: number;
  target?: number | null;
  planStatus?: string | null;
  actual?: number | null;
  achievement?: number | null;
  contribution?: number | null;
  plannedContributionWeight: number;
  resultStatus?: string | null;
}

export interface SupportPerformanceRow {
  objectiveSupportSourceId: string;
  sourceCorporateKpiId: string;
  sourceCorporateKpiName: string;
  sourceCorporateObjectiveId: string;
  sourceCorporateObjectiveTitle: string;
  unitType: string;
  unitId: string;
  unitName: string;
  supportObjectiveId: string;
  supportObjectiveTitle: string;
  expectedImpact?: string | null;
  localKpiId?: string | null;
  localKpiName?: string | null;
  readinessStatus: string;
  quarters: SupportQuarterOutcome[];
  annualContribution: number;
  plannedContributionWeight: number;
  annualAchievement?: number | null;
}

export interface SupportPerformanceSourceSummary {
  sourceCorporateKpiId: string;
  sourceCorporateKpiName: string;
  sourceCorporateObjectiveId: string;
  sourceCorporateObjectiveTitle: string;
  localKpiCount: number;
  resultCount: number;
  planCount: number;
  plannedContributionWeight: number;
  achievedContributionWeight: number;
  achievementRate: number;
  resultCoverageRate: number;
}

export interface SupportPerformanceReportData {
  annualStrategicPeriodId: string;
  scope: SupportPerformanceScope;
  readiness: SupportReadinessSummary;
  sourceSummaries: SupportPerformanceSourceSummary[];
  rows: SupportPerformanceRow[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
