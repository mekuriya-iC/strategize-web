import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewStrategyButtonProps {
  onClick?: () => void;
}

export default function NewStrategyButton({ onClick }: NewStrategyButtonProps) {
  return (
    <Button
      variant="outline"
      className="flex items-center gap-2 px-6 py-2 text-primary border-primary"
      onClick={onClick}
    >
      <Plus size={18} />
      New Strategy
    </Button>
  );
}
