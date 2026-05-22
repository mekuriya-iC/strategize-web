import type { Objective } from "@/types/graphql";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const DONUT_COLORS = [
  "#3838EC",
  "#726BEA",
  "#5B5BFF",
  "#A3A3FF",
  "#C7C7FF",
  "#E0E0FF",
  "#F4F4FF",
];

function timelineBucketLabel(
  timeline: string,
  annualTimeline?: string | null,
): string {
  if (!timeline) return "Other";

  if (annualTimeline && timeline.startsWith(`${annualTimeline}-`)) {
    const suffix = timeline.slice(annualTimeline.length + 1);
    if (suffix.match(/^Q[1-4]$/i)) return suffix.toUpperCase();
    if (suffix.match(/^\d{2}$/)) {
      const monthIndex = parseInt(suffix, 10) - 1;
      return MONTH_LABELS[monthIndex] ?? suffix;
    }
    return suffix;
  }

  if (timeline.match(/^Q[1-4]$/i)) return timeline.toUpperCase();
  if (MONTH_LABELS.includes(timeline as (typeof MONTH_LABELS)[number])) {
    return timeline;
  }

  const parsed = new Date(timeline);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString("en", { month: "short" });
  }

  return timeline;
}

function matchesAnnualTimeline(
  timeline: string,
  annualTimeline: string,
): boolean {
  return (
    timeline === annualTimeline || timeline.startsWith(`${annualTimeline}-`)
  );
}

export function buildDashboardChartData(
  objectives: Objective[],
  annualTimeline?: string | null,
) {
  const kpisByPeriod: Record<string, number> = {};
  const kpisByCategory: Record<string, number> = {};

  let usedTargetTimelines = false;

  objectives.forEach((obj) => {
    const category = obj.title?.trim() || "Uncategorized";

    obj.kpis?.forEach((kpi) => {
      kpisByCategory[category] = (kpisByCategory[category] || 0) + 1;

      const targets =
        (kpi as { targets?: Array<{ timeline?: string | null }> }).targets ??
        [];
      if (targets.length > 0) {
        targets.forEach((t) => {
          if (!t.timeline) return;
          if (
            annualTimeline &&
            !matchesAnnualTimeline(t.timeline, annualTimeline)
          ) {
            return;
          }
          usedTargetTimelines = true;
          const label = timelineBucketLabel(t.timeline, annualTimeline);
          kpisByPeriod[label] = (kpisByPeriod[label] || 0) + 1;
        });
      } else if (obj.createdAt) {
        const month = new Date(obj.createdAt).toLocaleString("en", {
          month: "short",
        });
        kpisByPeriod[month] = (kpisByPeriod[month] || 0) + 1;
      }
    });
  });

  // Default month axis when no target timelines exist
  const barLabels = usedTargetTimelines
    ? Object.keys(kpisByPeriod)
    : [...MONTH_LABELS];

  const barValues = barLabels.map((label) => kpisByPeriod[label] ?? 0);

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: "KPIs",
        data: barValues,
        backgroundColor: "#3838EC",
        borderRadius: 8,
      },
    ],
  };

  const sortedCategories = Object.entries(kpisByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7);

  const donutData = {
    labels: sortedCategories.map(([name]) => name),
    datasets: [
      {
        data: sortedCategories.map(([, count]) => count),
        backgroundColor: DONUT_COLORS,
        borderWidth: 0,
      },
    ],
  };

  return {
    barData,
    donutData,
    totalKpis: Object.values(kpisByCategory).reduce((a, b) => a + b, 0),
  };
}
