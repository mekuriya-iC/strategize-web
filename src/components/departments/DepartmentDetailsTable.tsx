import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import DepartmentDetailsRow, { DepartmentDetail } from "./DepartmentDetailsRow";

const mockDetails: DepartmentDetail[] = [
  {
    corporateKPI: "200+ employees trained in Q1",
    kpi: "Over 200 team members completed training in the first month",
    baseline: 12,
    weight: "10%",
    target2023: 25,
    target2024: 40,
    target2025: 30,
    finalTarget: 45,
    assignedTo: "John Doe",
  },
  {
    corporateKPI: "Implement a training platform throughout...",
    kpi: "Over 200 staff members completed training in the first month",
    baseline: 12,
    weight: "10%",
    target2023: 25,
    target2024: 40,
    target2025: 30,
    finalTarget: 45,
    assignedTo: "Jane Doe",
  },
  {
    corporateKPI: "Deploy a learning management system across 3 departments",
    kpi: "New training modules launched for leadership development",
    baseline: 12,
    weight: "10%",
    target2023: 25,
    target2024: 40,
    target2025: 30,
    finalTarget: 45,
    assignedTo: "Bill Doe",
  },
  // ...more mock rows
];

const DepartmentDetailsTable = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>CORPORATE KPI</TableHead>
          <TableHead>KPI</TableHead>
          <TableHead>BASELINE</TableHead>
          <TableHead>WEIGHT</TableHead>
          <TableHead>TARGET 2023/24</TableHead>
          <TableHead>2024/25</TableHead>
          <TableHead>2025/26</TableHead>
          <TableHead>FINAL TARGET</TableHead>
          <TableHead>ASSIGNED TO</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockDetails.map((detail, idx) => (
          <DepartmentDetailsRow key={idx} detail={detail} odd={idx % 2 === 1} />
        ))}
      </TableBody>
    </Table>
  );
};

export default DepartmentDetailsTable;
