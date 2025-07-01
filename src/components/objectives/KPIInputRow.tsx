import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface KPIInputRowProps {
  kpi: {
    name: string;
    weight: string;
    type: string;
  };
  index: number;
  onChange: (index: number, field: string, value: string) => void;
  onRemove?: (index: number) => void;
  canRemove?: boolean;
  onAddNew?: () => void;
  showAddButton?: boolean;
}

export default function KPIInputRow({
  kpi,
  index,
  onChange,
  onRemove,
  canRemove = false,
  onAddNew,
  showAddButton = false,
}: KPIInputRowProps) {
  return (
    <div className="mb-6 ">
      {/* Show header only for first KPI */}
      {index === 0 && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          KPIs
        </h3>
      )}

      {/* KPI Input Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KPI Name Input with inline unit selector */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            KPI {index + 1}
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter KPI name"
              value={kpi.name}
              onChange={(e) => onChange(index, "name", e.target.value)}
              className="flex-1"
            />
            <Select
              value={kpi.type}
              onValueChange={(val) => onChange(index, "type", val)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="In Percent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">In Percent</SelectItem>
                <SelectItem value="number">In Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Weight Input Only */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Weight {index + 1}
          </label>
          <Input
            type="text"
            placeholder="Weight"
            value={kpi.weight}
            onChange={(e) => onChange(index, "weight", e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Remove button if can remove - centered */}
      {canRemove && (
        <div className="flex justify-center mt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onRemove?.(index)}
            className="text-red-500 hover:text-red-700"
          >
            Remove
          </Button>
        </div>
      )}

      {/* New KPI Button - only show for the last item - centered */}
    </div>
  );
}
