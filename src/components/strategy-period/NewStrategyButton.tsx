import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewStrategyButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className="flex items-center gap-2 px-8 md:px-12 py-2.5 border border-primary text-primary hover:bg-primary/5 transition-colors rounded-lg font-medium"
      onClick={() => router.push("/strategy-period/new")}
      size="lg"
    >
      <Plus size={18} />
      New Strategy
    </Button>
  );
}
