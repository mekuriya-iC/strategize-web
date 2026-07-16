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
  resultStatus?: string | null;
}

export interface SupportPerformanceRow {
  objectiveSupportSourceId: string;
  sourceCorporateKpiId: string;
  sourceCorporateKpiName: string;
  unitType: string;
  unitId: string;
  unitName: string;
  supportObjectiveId: string;
  supportObjectiveTitle: string;
  localKpiId?: string | null;
  localKpiName?: string | null;
  readinessStatus: string;
  quarters: SupportQuarterOutcome[];
  annualContribution: number;
  annualAchievement?: number | null;
}

export interface SupportPerformanceReportData {
  annualStrategicPeriodId: string;
  scope: SupportPerformanceScope;
  readiness: SupportReadinessSummary;
  rows: SupportPerformanceRow[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
