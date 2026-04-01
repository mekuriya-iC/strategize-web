import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface KPIInputRowProps {
  value: {
    kpi: string;
    corporateObjective: string;
    baseline: string;
    weight: string;
    target: string;
    targetType: string;
  };
  onChange: (value: KPIInputRowProps["value"]) => void;
  onRemove: () => void;
  index: number;
  corporateObjectives: string[];
}

const KPIInputRow: React.FC<KPIInputRowProps> = ({
  value,
  onChange,
  onRemove,
  index,
  corporateObjectives,
}) => {
  return (
    <div className="grid grid-cols-6 gap-3 items-center mb-2">
      <Input
        placeholder={`KPI ${index + 1}`}
        value={value.kpi}
        onChange={(e) => onChange({ ...value, kpi: e.target.value })}
        className=""
      />
      <Select
        value={value.corporateObjective}
        onValueChange={(val) => onChange({ ...value, corporateObjective: val })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Corporate Objective" />
        </SelectTrigger>
        <SelectContent>
          {corporateObjectives.map((obj) => (
            <SelectItem key={obj} value={obj}>
              {obj}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Baseline"
        value={value.baseline}
        onChange={(e) => onChange({ ...value, baseline: e.target.value })}
      />
      <Input
        placeholder="Weight"
        value={value.weight}
        onChange={(e) => onChange({ ...value, weight: e.target.value })}
      />
      <Input
        placeholder="Target"
        value={value.target}
        onChange={(e) => onChange({ ...value, target: e.target.value })}
      />
      <div className="flex items-center gap-2">
        <Input
          placeholder="Target Type"
          value={value.targetType}
          onChange={(e) => onChange({ ...value, targetType: e.target.value })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="ml-1"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default KPIInputRow;
