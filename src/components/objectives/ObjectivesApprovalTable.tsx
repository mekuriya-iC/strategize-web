"use client";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import React from "react";
import KPIDetailsView from "./KPIDetailsView";

const mockObjectives = [
  {
    id: "1",
    title: "Increase i-Capital's shareholder value",
    kpis: [
      "Revenue from LSL(4 line) in million",
      "Revenue from RAS(5 line) in million",
      "Revenue from KSP in million",
    ],
    weight: 30,
    status: "not_submitted",
  },
  {
    id: "2",
    title: "Implement a training platform throughout three divisions.",
    kpis: [
      "Employee training completion rate",
      "Average training score",
      "Training hours per employee",
      "Feedback score",
    ],
    weight: 13,
    status: "not_submitted",
  },
  {
    id: "3",
    title: "Deploy a learning management system across 3 departments.",
    kpis: ["System adoption rate", "User satisfaction"],
    weight: 17,
    status: "not_submitted",
  },
  {
    id: "4",
    title: "Implement a training platform throughout three divisions.",
    kpis: [
      "Employee training completion rate",
      "Average training score",
      "Training hours per employee",
    ],
    weight: 20,
    status: "not_submitted",
  },
  {
    id: "5",
    title: "Deploy a learning management system across 3 departments.",
    kpis: [
      "System adoption rate",
      "User satisfaction",
      "Course completion rate",
    ],
    weight: 20,
    status: "not_submitted",
  },
];

const statusMap = {
  not_submitted: { label: "Not Submitted", color: "bg-pink-100 text-pink-600" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-600" },
  approved: { label: "Approved", color: "bg-green-100 text-green-600" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-600" },
};

export default function ObjectivesApprovalTable() {
  const [objectives, setObjectives] = useState(mockObjectives);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<
    (typeof mockObjectives)[0] | null
  >(null);

  const allSelected = selected.length === objectives.length;

  const handleSelectAll = () => {
    setSelected(allSelected ? [] : objectives.map((o) => o.id));
  };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const handleSubmitForApproval = () => {
    setObjectives((prev) =>
      prev.map((o) =>
        selected.includes(o.id) ? { ...o, status: "pending" } : o
      )
    );
    setSelected([]);
  };

  if (selectedObjective) {
    return (
      <KPIDetailsView
        objective={selectedObjective}
        onBack={() => setSelectedObjective(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <Input type="text" placeholder="Search..." className="w-1/3" />
        <Button variant="outline">All</Button>
        <Button
          className="ml-auto"
          disabled={selected.length === 0}
          onClick={handleSubmitForApproval}
        >
          Submit for Approval
        </Button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="py-4 text-base font-semibold">
                {/* Checkbox */}
              </TableHead>
              <TableHead className="py-4 text-base font-semibold">
                Strategic Objective
              </TableHead>
              <TableHead className="py-4 text-base font-semibold">
                KPI
              </TableHead>
              <TableHead className="py-4 text-base font-semibold">
                Weight
              </TableHead>
              <TableHead className="py-4 text-base font-semibold">
                Status
              </TableHead>
              <TableHead className="py-4 text-base font-semibold"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objectives.map((obj, idx) => (
              <React.Fragment key={obj.id}>
                <TableRow
                  className={`group transition-colors border-b border-muted
                    ${
                      selected.includes(obj.id)
                        ? "bg-primary/10"
                        : idx % 2 === 0
                        ? "bg-white"
                        : "bg-muted/30"
                    }
                    hover:bg-primary/5
                  `}
                  onClick={() => setSelectedObjective(obj)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell className="py-4 text-base">
                    <Checkbox
                      checked={selected.includes(obj.id)}
                      onCheckedChange={() => handleSelect(obj.id)}
                    />
                  </TableCell>
                  <TableCell className="py-4 text-base font-bold">
                    {obj.title}
                  </TableCell>
                  <TableCell className="py-4 text-base">
                    <span className="text-xs text-muted-foreground font-normal">
                      {obj.kpis.length} KPIs
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-base">
                    {obj.weight}%
                  </TableCell>
                  <TableCell className="py-4 text-base">
                    <Badge
                      className={`${
                        statusMap[obj.status as keyof typeof statusMap].color
                      } rounded-full px-3 py-1 text-xs font-semibold shadow-none`}
                    >
                      {statusMap[obj.status as keyof typeof statusMap].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-base">
                    <button onClick={() => handleExpand(obj.id)}>
                      {expanded === obj.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
                {expanded === obj.id && (
                  <TableRow className="bg-muted/20">
                    <TableCell></TableCell>
                    <TableCell
                      colSpan={5}
                      className="py-4 text-base font-normal"
                    >
                      <ul className="pl-4 text-sm text-muted-foreground">
                        {obj.kpis.map((kpi, i) => (
                          <li key={i}>{kpi}</li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Progress Bar */}
      <div className="flex items-center justify-between mt-4">
        <span>{objectives.length} Objectives</span>
        <div className="w-1/3 bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: "100%" }}
          />
        </div>
        <span className="text-green-600 font-semibold">100%</span>
      </div>
      {/* Pagination */}
      <div className="flex justify-end mt-2">
        <Button variant="ghost">Previous</Button>
        <Button variant="ghost" className="font-bold">
          1
        </Button>
        <Button variant="ghost">2</Button>
        <Button variant="ghost">Next</Button>
      </div>
    </div>
  );
}
