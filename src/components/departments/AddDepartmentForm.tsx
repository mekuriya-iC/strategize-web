import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import KPIInputRow from "./KPIInputRow";

interface KPIData {
  kpi: string;
  corporateObjective: string;
  baseline: string;
  weight: string;
  target: string;
  targetType: string;
}

interface FormData {
  departmentObjective: string;
  corporateObjective: string;
  kpis: KPIData[];
}

const mockCorporateObjectives = [
  "Deploy a learning management system across 3 departments",
  "Implement a training platform throughout...",
];

const AddDepartmentForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit?: (data: FormData) => void;
  onCancel?: () => void;
}) => {
  const [departmentObjective, setDepartmentObjective] = useState("");
  const [corporateObjective, setCorporateObjective] = useState("");
  const [kpis, setKpis] = useState([
    {
      kpi: "",
      corporateObjective: "",
      baseline: "",
      weight: "",
      target: "",
      targetType: "",
    },
  ]);

  const handleKPIChange = (idx: number, value: KPIData) => {
    setKpis((kpis) => kpis.map((k, i) => (i === idx ? value : k)));
  };

  const handleAddKPI = () => {
    setKpis([
      ...kpis,
      {
        kpi: "",
        corporateObjective: "",
        baseline: "",
        weight: "",
        target: "",
        targetType: "",
      },
    ]);
  };

  const handleRemoveKPI = (idx: number) => {
    setKpis((kpis) => kpis.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ departmentObjective, corporateObjective, kpis });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Department Objective
          </label>
          <Input
            placeholder="Department Objective"
            value={departmentObjective}
            onChange={(e) => setDepartmentObjective(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Corporate Objective
          </label>
          <Select
            value={corporateObjective}
            onValueChange={setCorporateObjective}
          >
            <SelectTrigger>
              <SelectValue placeholder="Corporate Objective" />
            </SelectTrigger>
            <SelectContent>
              {mockCorporateObjectives.map((obj) => (
                <SelectItem key={obj} value={obj}>
                  {obj}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <div className="font-semibold mb-4 text-lg">KPIs</div>
        <div className="hidden md:grid grid-cols-6 gap-3 text-xs text-muted-foreground font-medium mb-2 px-1">
          <div>KPI</div>
          <div>Corporate Objective</div>
          <div>Baseline</div>
          <div>Weight</div>
          <div>Target</div>
          <div>Target Type</div>
        </div>
        <div className="flex flex-col gap-2">
          {kpis.map((kpi, idx) => (
            <KPIInputRow
              key={idx}
              value={kpi}
              onChange={(val) => handleKPIChange(idx, val)}
              onRemove={() => handleRemoveKPI(idx)}
              index={idx}
              corporateObjectives={mockCorporateObjectives}
            />
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <Button
            type="button"
            variant="link"
            onClick={handleAddKPI}
            className="text-primary font-medium"
          >
            + New KPI
          </Button>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Department</Button>
      </div>
    </form>
  );
};

export default AddDepartmentForm;
