export interface TaskSummaryInput {
  taskType?: string | null;
  logbookStatus?: string | null;
}

export interface TaskTypeSummary {
  totalTasks: number;
  totalKpiTasks: number;
  nonKpiTasks: number;
  kpiFulfilled: number;
  kpiUnmet: number;
  overdueKpiFulfilled: number;
  kpiFulfilledPercentage: number;
  kpiUnmetPercentage: number;
}

export function summarizeTaskTypes(
  tasks: readonly TaskSummaryInput[],
): TaskTypeSummary {
  const totalTasks = tasks.length;
  const kpiFulfilledTasks = tasks.filter(
    (task) => task.taskType === "KPI_FULFILLED",
  );
  const overdueKpiFulfilled = kpiFulfilledTasks.filter((task) =>
    ["OVERDUE", "REJECTED"].includes(
      task.logbookStatus?.toUpperCase() || "",
    ),
  ).length;
  const kpiFulfilled = kpiFulfilledTasks.length - overdueKpiFulfilled;
  const kpiUnmet = tasks.filter(
    (task) => task.taskType === "KPI_UNMET",
  ).length;
  const totalKpiTasks = kpiFulfilledTasks.length + kpiUnmet;
  const nonKpiTasks = totalTasks - totalKpiTasks;

  return {
    totalTasks,
    totalKpiTasks,
    nonKpiTasks,
    kpiFulfilled,
    kpiUnmet,
    overdueKpiFulfilled,
    kpiFulfilledPercentage:
      totalKpiTasks > 0
        ? Math.round((kpiFulfilled / totalKpiTasks) * 100)
        : 0,
    kpiUnmetPercentage:
      totalKpiTasks > 0 ? Math.round((kpiUnmet / totalKpiTasks) * 100) : 0,
  };
}
