import { useApolloClient, useMutation } from "@apollo/client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/auth/useAuth";
import { FINALIZE_KPI_QUARTER } from "@/lib/graphql/queries/kpi-scorecard";
import type { KpiQuarterPlan, KpiQuarterResult } from "@/types/graphql";

interface QuarterPerformanceCellProps {
  kpiId: string;
  plans?: KpiQuarterPlan[];
  results?: KpiQuarterResult[];
}

export function QuarterPerformanceCell({
  kpiId,
  plans = [],
  results = [],
}: QuarterPerformanceCellProps) {
  const { user } = useAuth();
  const client = useApolloClient();
  const canFinalize = ["HR", "ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "");
  const [finalizingQuarter, setFinalizingQuarter] = useState<number | null>(
    null,
  );
  const [finalizeQuarter, { loading }] = useMutation(FINALIZE_KPI_QUARTER, {
    onCompleted: async () => {
      toast.success("Quarter finalized and carry-forward applied");
      await client.refetchQueries({
        include: ["GetRealtimeIndividualScorecard", "GetTotalScorecardScore"],
      });
    },
    onError: (error) => toast.error(error.message),
  });

  const handleFinalize = async (quarterNumber: number) => {
    setFinalizingQuarter(quarterNumber);
    try {
      await finalizeQuarter({ variables: { kpiId, quarterNumber } });
    } finally {
      setFinalizingQuarter(null);
    }
  };

  if (plans.length === 0) {
    return <span className="text-xs text-muted-foreground">Annual only</span>;
  }

  return (
    <div className="grid min-w-105 grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((quarter) => {
        const plan = plans.find((item) => item.quarterNumber === quarter);
        const result = results.find(
          (item) => item.quarterPlanId === plan?.kpiQuarterPlanId,
        );
        const achievement = result
          ? `${(Number(result.finalAchievementRate) * 100).toFixed(1)}%`
          : "—";
        const isFinalizing = loading && finalizingQuarter === quarter;
        const showFinalize =
          canFinalize &&
          plan?.status === "APPROVED" &&
          result?.status === "PROVISIONAL";

        return (
          <div
            key={quarter}
            className="rounded-md border bg-muted/30 p-2 text-xs"
          >
            <div className="mb-1 flex items-center justify-between gap-1 font-semibold">
              <span>Q{quarter}</span>
              <span
                className={
                  result?.status === "FINAL"
                    ? "text-green-600"
                    : "text-amber-600"
                }
              >
                {result?.status ?? plan?.status ?? "—"}
              </span>
            </div>
            <div className="text-muted-foreground">
              Original: {plan ? Number(plan.originalTarget).toFixed(2) : "—"}
            </div>
            <div
              className={
                Number(plan?.carryIn ?? 0) < 0
                  ? "text-green-600"
                  : "text-amber-600"
              }
            >
              Carry: {plan ? formatSigned(Number(plan.carryIn ?? 0)) : "—"}
            </div>
            <div className="font-medium">
              Effective: {plan ? Number(plan.effectiveTarget).toFixed(2) : "—"}
            </div>
            <div>
              Actual: {result ? Number(result.finalActual).toFixed(2) : "—"}
            </div>
            <div>Achievement: {achievement}</div>
            <div className="text-primary">
              Contribution:{" "}
              {result ? `${Number(result.weightedScore).toFixed(2)}%` : "—"}
            </div>
            <div className="mt-1 border-t pt-1 text-muted-foreground">
              {result?.status === "FINAL" ? "Applied carry" : "Projected carry"}
              : {result ? formatSigned(Number(result.carryOut)) : "—"}
            </div>

            {showFinalize && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 w-full text-xs"
                    disabled={isFinalizing}
                  >
                    {isFinalizing && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    Finalize Q{quarter}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Finalize Q{quarter}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This locks the quarter result and{" "}
                      {quarter < 4
                        ? `applies its ${formatSigned(Number(result.carryOut))} balance to Q${quarter + 1}`
                        : "records the final annual balance"}
                      . Finalized quarters cannot accept new logbook
                      achievements.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleFinalize(quarter)}>
                      Finalize Quarter
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatSigned(value: number): string {
  if (value === 0) return "0.00";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}
