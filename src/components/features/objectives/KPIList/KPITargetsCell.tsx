import React from "react";
import { Badge } from "@/components/ui/badge";
import { Kpi } from "@/types/graphql";
import { getYearlyTotals, getQuartersByYear } from "@/utils/strategic/kpi-math";
import { getUnitLabel, formatKpiValue } from "@/utils/kpi-format";

interface KPITargetsCellProps {
    kpi: Kpi;
    childQuartersByParentId?: Record<string, Record<string, { q1?: number; q2?: number; q3?: number; q4?: number }>>;
    strategicTargetsById?: Record<string, Record<string, number>>;
    currentObjectiveType?: string;
    allKpis: Kpi[];
}

const KPITargetsCell: React.FC<KPITargetsCellProps> = ({
    kpi,
    childQuartersByParentId,
    strategicTargetsById,
    currentObjectiveType,
    allKpis,
}) => {
    if (!kpi.targets || kpi.targets.length === 0) return <span>No targets</span>;

    if (kpi.status !== "APPROVED") {
        const { years, totals } = getYearlyTotals(kpi.targets, kpi);
        return (
            <div className="flex flex-wrap gap-2">
                {years.map((y) => (
                    <div key={y} className="flex flex-col border-l-2 border-gray-100 pl-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{y}</span>
                        <span className="text-sm font-medium">
                            {formatKpiValue(totals[y], kpi.unitType || "NUMBER", { compact: true })}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    // Approved mode logic
    const corporate = kpi.objective?.type === "CORPORATE";
    const childQuarters = !corporate ? childQuartersByParentId?.[kpi.kpiId] || {} : undefined;
    const hasChildQuarters = childQuarters && Object.keys(childQuarters).length > 0;

    const isRateUnit = kpi.unitType === "PERCENT" || kpi.unitType === "RATIO";
    const shouldAverageQuarters = kpi.quarterlyAggregationMethod
        ? kpi.quarterlyAggregationMethod === "AVERAGE"
        : isRateUnit;
    const { years, totals } = hasChildQuarters
        ? (() => {
            const yrs = Object.keys(childQuarters).sort(
                (a, b) => parseInt(a.split("/")?.[0] || "0") - parseInt(b.split("/")?.[0] || "0")
            );
            const t: Record<string, number> = {};
            yrs.forEach((y) => {
                const q = (childQuarters as any)[y] || {};
                const sum = (q.q1 || 0) + (q.q2 || 0) + (q.q3 || 0) + (q.q4 || 0);
                const count = [q.q1, q.q2, q.q3, q.q4].filter(v => v !== undefined).length;

                if (shouldAverageQuarters && count > 0) {
                    t[y] = sum / count;
                } else {
                    t[y] = sum;
                }
            });
            return { years: yrs, totals: t } as const;
        })()
        : getYearlyTotals(kpi.targets, kpi);

    const qByYear = hasChildQuarters ? childQuarters : getQuartersByYear(kpi.targets).qByYear;

    return (
        <div
            className="inline-grid gap-x-8"
            style={{ gridTemplateColumns: `repeat(${years.length}, minmax(80px, auto))` }}
        >
            {years.map((y) => (
                <div key={y} className="flex flex-col">
                    <span className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">{y}</span>
                    <div className="flex flex-col gap-1 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">
                                {formatKpiValue(totals[y], kpi.unitType || "NUMBER", { showUnit: false })}
                            </span>
                            <Badge variant="outline" className="text-[10px] scale-90">
                                {getUnitLabel(kpi.unitType || "NUMBER")}
                            </Badge>
                        </div>

                        {/* Division KPI / Strategic Goal reference */}
                        {kpi.objective?.type === "DIVISION" && kpi.parent?.kpiId && strategicTargetsById?.[kpi.parent.kpiId]?.[y] !== undefined && (
                            <div className="mt-1 flex flex-col gap-0.5 border-l-2 border-purple-200 pl-2 bg-purple-50/30 rounded-r-sm py-1">
                                <span className="text-[9px] uppercase font-bold text-purple-400 tracking-tight">Strategic Goal</span>
                                <span className="text-[11px] font-bold text-purple-700">
                                    {formatKpiValue(strategicTargetsById[kpi.parent.kpiId][y], kpi.unitType || "NUMBER", { showUnit: false })}
                                </span>
                            </div>
                        )}

                        {/* Corporate KPI / Child Sum reference */}
                        {kpi.objective?.type === "CORPORATE" && (() => {
                            let childValues: number[] = [];
                            const children = allKpis.filter(k => k.parent?.kpiId === kpi.kpiId && k.objective?.type !== "CORPORATE");
                            children.forEach(ck => {
                                const val = getYearlyTotals(ck.targets, ck).totals[y];
                                if (val !== undefined) childValues.push(val);
                            });

                            if (childValues.length > 0) {
                                if (kpi.calculationType === "RATIO_FORMULA") return null;
                                const averageChildren =
                                    kpi.aggregationMethod === "SIMPLE_AVERAGE";
                                const result = averageChildren
                                    ? childValues.reduce((a, b) => a + b, 0) / childValues.length
                                    : childValues.reduce((a, b) => a + b, 0);

                                return (
                                    <div className="text-[10px] text-gray-400">
                                        {averageChildren ? "Avg" : "Sum"}: <span className="font-medium text-blue-600">
                                            {formatKpiValue(result, kpi.unitType || "NUMBER", { showUnit: false })}
                                        </span>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Quarterly Breakdown Display - Only show for non-CORPORATE levels */}
                        {qByYear[y] && kpi.objective?.type !== "CORPORATE" && (
                            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-gray-50 pt-1.5">
                                {["q1", "q2", "q3", "q4"].map((qKey) => {
                                    const val = (qByYear[y] as any)[qKey];
                                    if (val === undefined) return null;
                                    return (
                                        <div key={qKey} className="flex justify-between items-center gap-1.5 min-w-[35px]">
                                            <span className="text-[9px] text-gray-400 font-bold uppercase">{qKey}</span>
                                            <span className="text-[10px] font-medium text-gray-600">
                                                {formatKpiValue(val, kpi.unitType || "NUMBER", { showUnit: false, decimals: isRateUnit ? 1 : 0 })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KPITargetsCell;
