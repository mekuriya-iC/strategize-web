import type { TaskCompletionPeriodRow } from "./types";

const DAY = 86400000;
const date = (value: string) => new Date(`${value}T00:00:00Z`);

export function weeklyBaseline(
  series: TaskCompletionPeriodRow[],
  today: string,
) {
  // Never learn from a partial, current, or future week. Zero-volume completed
  // weeks count toward throughput, but never introduce fake zero success rates.
  const weeks = series.filter((row) => {
    const start = date(row.periodStart);
    return (
      start.getUTCDay() === 1 &&
      date(row.periodEnd).getUTCDay() === 0 &&
      date(row.periodEnd).getTime() - start.getTime() === 6 * DAY &&
      row.periodEnd < today
    );
  });
  const total = weeks.reduce((sum, row) => sum + row.totalTasks, 0);
  const completed = weeks.reduce((sum, row) => sum + row.completedTasks, 0);
  if (weeks.length < 2 || total === 0) return null;
  const midpoint = Math.floor(weeks.length / 2);
  const rate = (rows: TaskCompletionPeriodRow[]) => {
    const count = rows.reduce((sum, row) => sum + row.totalTasks, 0);
    return count
      ? (rows.reduce((sum, row) => sum + row.completedTasks, 0) / count) * 100
      : null;
  };
  const earlier = rate(weeks.slice(0, midpoint));
  const later = rate(weeks.slice(midpoint));
  return {
    weeks: weeks.length,
    total,
    completed,
    weeklyVolume: total / weeks.length,
    completionRate: (completed / total) * 100,
    change: earlier === null || later === null ? null : later - earlier,
  };
}

export function projectDelivery(
  weeklyVolume: number,
  rate: number,
  weeks: number,
) {
  if (
    ![weeklyVolume, rate, weeks].every(Number.isFinite) ||
    weeklyVolume < 0 ||
    rate < 0 ||
    rate > 100 ||
    weeks < 1 ||
    weeks > 52 ||
    !Number.isInteger(weeks)
  )
    return null;
  const total = weeklyVolume * weeks;
  const completed = (total * rate) / 100;
  return { total, completed, unfinished: total - completed };
}

// This is an explicit score-gap scenario, not a prediction of KPI actuals.
// It never sums heterogeneous KPI units or converts task counts into KPI scores.
export function projectScoreGap(baseline: number, gapClosedPercent: number) {
  if (
    ![baseline, gapClosedPercent].every(Number.isFinite) ||
    baseline < 0 ||
    gapClosedPercent < 0 ||
    gapClosedPercent > 100
  )
    return null;
  const gap = Math.max(0, 100 - baseline);
  const score = baseline + (gap * gapClosedPercent) / 100;
  return {
    score,
    improvement: score - baseline,
    remaining: Math.max(0, 100 - score),
  };
}

export function localCalendarDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
