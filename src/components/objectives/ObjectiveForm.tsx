"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import KPIInputRow from "./KPIInputRow";

export default function ObjectiveForm() {
  const [objectiveName, setObjectiveName] = useState("");
  const [kpis, setKpis] = useState([{ name: "", type: "percent", weight: "" }]);

  const handleKPIChange = (index: number, field: string, value: string) => {
    setKpis((kpis) =>
      kpis.map((kpi, i) => (i === index ? { ...kpi, [field]: value } : kpi))
    );
  };

  const handleAddKPI = () => {
    setKpis([...kpis, { name: "", type: "percent", weight: "" }]);
  };

  const handleRemoveKPI = (index: number) => {
    setKpis((kpis) => kpis.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add validation and submission logic
    alert("Objective submitted!");
  };

  return (
    <div className="min-h-[70vh] flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Content Container */}
        <div className="flex-1 space-y-10 pb-6">
          {/* Objective Name */}
          <div>
            <label className="block font-medium mb-2">Objective Name</label>
            <Input
              placeholder="Enter objective name"
              value={objectiveName}
              onChange={(e) => setObjectiveName(e.target.value)}
              required
              className="max-w-xl"
            />
          </div>
          {/* KPIs Section */}
          <div>
            {kpis.map((kpi, idx) => (
              <div key={idx} className="mb-6">
                <KPIInputRow
                  kpi={kpi}
                  index={idx}
                  onChange={handleKPIChange}
                  onRemove={handleRemoveKPI}
                  canRemove={kpis.length > 1}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="link"
              className="text-[#3838EC] pl-0 cursor-pointer text-center w-full"
              onClick={handleAddKPI}
            >
              + New KPI
            </Button>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-4 py-4   bottom-0">
          <Button
            type="button"
            variant="ghost"
            className="text-primary cursor-pointer border border-primary hover:bg-primary hover:text-white"
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-[#3838EC] text-white">
            Add Objective
          </Button>
        </div>
      </form>
    </div>
  );
}
