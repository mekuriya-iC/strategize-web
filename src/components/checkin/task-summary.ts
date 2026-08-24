export interface TaskSummaryInput {
  taskType?: string | null;
}

export interface TaskTypeSummary {
  totalTasks: number;
  totalKpiTasks: number;
  nonKpiTasks: number;
  kpiFulfilled: number;
  kpiUnmet: number;
  kpiFulfilledPercentage: number;
  kpiUnmetPercentage: number;
}

export function summarizeTaskTypes(
  tasks: readonly TaskSummaryInput[],
): TaskTypeSummary {
  const totalTasks = tasks.length;
  const kpiFulfilled = tasks.filter(
    (task) => task.taskType === "KPI_FULFILLED",
  ).length;
  const kpiUnmet = tasks.filter(
    (task) => task.taskType === "KPI_UNMET",
  ).length;
  const totalKpiTasks = kpiFulfilled + kpiUnmet;
  const nonKpiTasks = totalTasks - totalKpiTasks;

  return {
    totalTasks,
    totalKpiTasks,
    nonKpiTasks,
    kpiFulfilled,
    kpiUnmet,
    kpiFulfilledPercentage:
      totalKpiTasks > 0
        ? Math.round((kpiFulfilled / totalKpiTasks) * 100)
        : 0,
    kpiUnmetPercentage:
      totalKpiTasks > 0 ? Math.round((kpiUnmet / totalKpiTasks) * 100) : 0,
  };
}
