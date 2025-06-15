import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function KPIInputRow({
  kpi,
  index,
  onChange,
  onRemove,
  canRemove,
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Input
        placeholder={`Enter KPI ${index + 1} name`}
        value={kpi.name}
        onChange={(e) => onChange(index, "name", e.target.value)}
        className="col-span-2 max-w-xl"
      />
      <div className="flex gap-2">
        <Select
          value={kpi.type}
          onValueChange={(val) => onChange(index, "type", val)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">In Percent</SelectItem>
            <SelectItem value="number">Number</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={`Weight ${index + 1} in Percent`}
          value={kpi.weight}
          onChange={(e) => onChange(index, "weight", e.target.value)}
          className="max-w-xl"
        />
        {canRemove && (
          <Button type="button" variant="ghost" onClick={() => onRemove(index)}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
