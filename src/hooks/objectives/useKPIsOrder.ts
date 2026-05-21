import { useMutation } from "@apollo/client";
import { REORDER_KPIS } from "@/lib/graphql/mutations/kpis";
import { toast } from "sonner";
import { useCacheStore } from "@/stores/cacheStore";

interface OrderUpdate {
  kpiId: string;
  order: number;
}

export function useKPIsOrder() {
  const invalidate = useCacheStore((state) => state.invalidate);

  const [reorderKpis, { loading }] = useMutation(REORDER_KPIS, {
    onCompleted: () => {
      invalidate("kpis");
    },
    onError: (error) => {
      console.error("Failed to update KPIs order:", error);
      toast.error("Failed to save KPI order. Please try again.");
    },
  });

  const saveOrder = async (updates: OrderUpdate[]) => {
    if (updates.length === 0) return;

    try {
      await reorderKpis({
        variables: {
          input: updates.map(({ kpiId, order }) => ({
            kpiId,
            order,
          })),
        },
      });
      toast.success("KPI order saved successfully");
    } catch (error) {
      // Error already handled in onError
      throw error;
    }
  };

  return {
    saveOrder,
    isSaving: loading,
  };
}
