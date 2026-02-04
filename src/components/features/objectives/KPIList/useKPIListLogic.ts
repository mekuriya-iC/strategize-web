import { useMemo } from "react";
import { Kpi } from "@/types/graphql";
import { useAuthStore } from "@/stores";

interface ColumnHeaders {
    firstColumn: string;
    secondColumn: string | null;
    showSecondColumn: boolean;
}

export const useKPIListLogic = (kpis: Kpi[]) => {
    const user = useAuthStore((state) => state.user);

    const columnHeaders = useMemo((): ColumnHeaders => {
        const allCorporate = kpis.length > 0 && kpis.every((k) => k.objective?.type === "CORPORATE");
        const hasDiv = kpis.some((k) => k.objective?.type === "DIVISION");
        const hasDept = kpis.some((k) => k.objective?.type === "DEPARTMENT");
        const hasPers = kpis.some((k) => k.objective?.type === "PERSONNEL");

        switch (user?.role) {
            case "SUPER_ADMIN":
            case "ADMIN":
                if (allCorporate) return { firstColumn: "CORPORATE KPI", secondColumn: null, showSecondColumn: false };
                if (hasDiv && !hasDept && !hasPers) return { firstColumn: "CORPORATE KPI", secondColumn: "DIVISION KPI", showSecondColumn: true };
                if (hasDept && !hasPers) return { firstColumn: "PARENT KPI", secondColumn: "DEPARTMENT KPI", showSecondColumn: true };
                if (hasPers) return { firstColumn: "DEPARTMENT KPI", secondColumn: "PERSONAL KPI", showSecondColumn: true };
                return { firstColumn: "CORPORATE KPI", secondColumn: "CHILD KPI", showSecondColumn: true };

            case "DIRECTOR":
                return { firstColumn: "CORPORATE KPI", secondColumn: "DIVISION KPI", showSecondColumn: true };

            case "MANAGER":
            case "COORDINATOR":
                if (allCorporate) return { firstColumn: "CORPORATE KPI", secondColumn: null, showSecondColumn: false };
                return { firstColumn: "DIVISION KPI", secondColumn: "DEPARTMENT KPI", showSecondColumn: true };

            case "NORMAL":
                return { firstColumn: "DEPARTMENT KPI", secondColumn: "PERSONNEL KPI", showSecondColumn: true };

            default:
                return { firstColumn: "STRATEGIC KPI", secondColumn: "KPI", showSecondColumn: true };
        }
    }, [kpis, user?.role]);

    const isCorporateObjective = useMemo(() =>
        kpis.length > 0 && kpis.every((k) => k.objective?.type === "CORPORATE")
        , [kpis]);

    const showReasonColumn = useMemo(() =>
        !isCorporateObjective && kpis.some((k) => k.status === "REJECTED")
        , [isCorporateObjective, kpis]);

    return {
        columnHeaders,
        isCorporateObjective,
        showReasonColumn,
    };
};
