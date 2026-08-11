import { Kpi } from "@/types/graphql";

export type QuarterTargetValues = {
    q1?: number;
    q2?: number;
    q3?: number;
    q4?: number;
};

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

const shouldAverageQuarterTargets = (kpi?: Partial<Kpi>) => {
    if (kpi?.quarterlyAggregationMethod) {
        return kpi.quarterlyAggregationMethod === "AVERAGE";
    }
    return kpi?.unitType === "PERCENT" || kpi?.unitType === "RATIO";
};

export const getQuarterTargetRollup = (
    quarters: QuarterTargetValues,
    kpi?: Partial<Kpi>,
) => {
    const values = [quarters.q1, quarters.q2, quarters.q3, quarters.q4].filter(
        (value): value is number => value !== undefined && Number.isFinite(value),
    );
    if (values.length === 0) return null;

    const sum = values.reduce((total, value) => total + value, 0);
    const shouldAverage = shouldAverageQuarterTargets(kpi);
    return {
        label: shouldAverage ? "Average" : "Sum",
        value: roundToTwoDecimals(shouldAverage ? sum / values.length : sum),
    } as const;
};

/**
 * Aggregates targets into yearly totals.
 * Handles both explicit yearly targets and quarterly sums/averages.
 */
export const getYearlyTotals = (targets: Kpi["targets"], kpi?: Partial<Kpi>) => {
    const totals: Record<string, number> = {};
    const quarterlySums: Record<string, number> = {};
    const quarterlyCounts: Record<string, number> = {};
    const yearsWithExplicitTotal: Set<string> = new Set();


    // First, find explicit yearly totals
    for (const t of targets) {
        if (!t.timeline.includes("-")) {
            const year = t.timeline;
            totals[year] = Number(t.target || 0);
            yearsWithExplicitTotal.add(year);
        }
    }

    // Then, sum/average quarters for years that DON'T have an explicit total
    for (const t of targets) {
        const parts = t.timeline.split("-");
        if (parts.length === 2 && parts[1].startsWith("Q")) {
            const year = parts[0];
            // const quarter = parts[1];

            // Normalize year: if year prefix exists as an explicit total, skip summing its quarters
            if (!yearsWithExplicitTotal.has(year)) {
                quarterlySums[year] = (quarterlySums[year] || 0) + Number(t.target || 0);
                quarterlyCounts[year] = (quarterlyCounts[year] || 0) + 1;
            }
        }
    }

    // Merge the quarterly values into the main totals object
    for (const year in quarterlySums) {
        if (!(year in totals)) {
            const shouldAverage = shouldAverageQuarterTargets(kpi);
            const total =
                shouldAverage && quarterlyCounts[year] > 0
                    ? quarterlySums[year] / quarterlyCounts[year]
                    : quarterlySums[year];
            totals[year] = roundToTwoDecimals(total);
        }
    }

    // Round explicit totals to 2 decimal places
    for (const year in totals) {
        totals[year] = roundToTwoDecimals(totals[year]);
    }

    const years = Object.keys(totals).sort((a, b) => {
        const aNum = parseInt(a.split("/")?.[0] || "0", 10);
        const bNum = parseInt(b.split("/")?.[0] || "0", 10);
        return aNum - bNum;
    });

    return { years, totals } as const;
};

/**
 * Maps quarters per year for easier consumption in UI.
 */
export const getQuartersByYear = (targets: Kpi["targets"]) => {
    const qByYear: Record<
        string,
        { q1?: number; q2?: number; q3?: number; q4?: number }
    > = {};

    for (const t of targets) {
        const parts = t.timeline.split("-");
        if (parts.length === 2) {
            const year = parts[0];
            const quarter = parts[1];
            if (!qByYear[year]) qByYear[year] = {};

            const qn = quarter.toUpperCase();
            if (qn === "Q1") qByYear[year].q1 = Number(t.target || 0);
            if (qn === "Q2") qByYear[year].q2 = Number(t.target || 0);
            if (qn === "Q3") qByYear[year].q3 = Number(t.target || 0);
            if (qn === "Q4") qByYear[year].q4 = Number(t.target || 0);
        }
    }

    const years = Object.keys(qByYear).sort((a, b) => {
        const aNum = parseInt(a.split("/")?.[0] || "0", 10);
        const bNum = parseInt(b.split("/")?.[0] || "0", 10);
        return aNum - bNum;
    });

    return { years, qByYear } as const;
};

/**
 * Calculates remaining target allocation for division KPIs sharing the same parent.
 */
export const calculateRemainingTargets = (
    currentKpi: Kpi,
    allKpis: Kpi[],
    strategicTargetsById?: Record<string, Record<string, number>>
) => {
    // Only calculate for division KPIs that have a parent
    if (currentKpi.objective?.type !== "DIVISION" || !currentKpi.parent?.kpiId) {
        return null;
    }

    const parentKpiId = currentKpi.parent.kpiId;

    // Get parent KPI's total targets
    const parentTargets = strategicTargetsById?.[parentKpiId] || {};

    if (Object.keys(parentTargets).length === 0) {
        return null;
    }

    // Find all division KPIs from the SAME DIVISION that share the same parent
    const currentDivisionId = currentKpi.objective?.objectiveId;
    const sameDivisionSiblingKPIs = allKpis.filter(
        (kpi) =>
            kpi.parent?.kpiId === parentKpiId &&
            kpi.objective?.type === "DIVISION" &&
            kpi.objective?.objectiveId === currentDivisionId
    );

    // Calculate total allocated by siblings from the SAME DIVISION only
    const totalAllocated: Record<string, number> = {};
    sameDivisionSiblingKPIs.forEach((siblingKpi) => {
        const siblingTargets = getYearlyTotals(siblingKpi.targets, siblingKpi).totals;
        Object.keys(siblingTargets).forEach((year) => {
            totalAllocated[year] = (totalAllocated[year] || 0) + siblingTargets[year];
        });
    });

    // Calculate remaining targets
    const remainingTargets: Record<string, number> = {};
    Object.keys(parentTargets).forEach((year) => {
        const parentTarget = parentTargets[year] || 0;
        const allocated = totalAllocated[year] || 0;
        remainingTargets[year] = Math.max(0, parentTarget - allocated);
    });

    return remainingTargets;
};
