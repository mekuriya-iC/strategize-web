import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewStrategyButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className="flex items-center gap-2 px-12 py-2  border border-primary text-primary cursor-pointer"
      onClick={() => router.push("/strategy-period/new")}
      size="lg"
    >
      <Plus size={18} />
      New Strategy
    </Button>
  );
}
