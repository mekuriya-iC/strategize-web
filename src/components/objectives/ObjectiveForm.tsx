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
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Objective Name */}
      <div>
        <label className="block font-medium mb-2 ">Objective Name</label>
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
        <label className="block font-medium mb-4 text-lg">KPIs</label>
        {kpis.map((kpi, idx) => (
          <div key={idx} className="mb-6">
            <div className="grid grid-cols-3 gap-4 mb-1">
              <label className="text-sm text-gray-500 col-span-2">{`KPI ${
                idx + 1
              }`}</label>
              <label className="text-sm text-gray-500">{`Weight ${
                idx + 1
              }`}</label>
            </div>
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
          className="text-[#3838EC] pl-0"
          onClick={handleAddKPI}
        >
          + New KPI
        </Button>
      </div>
      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-10">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" className="bg-[#3838EC] text-white">
          Add Objective
        </Button>
      </div>
    </form>
  );
}
