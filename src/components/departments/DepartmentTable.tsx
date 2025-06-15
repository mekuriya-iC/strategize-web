"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
// Placeholder import for row
// import DepartmentTableRow from "./DepartmentTableRow";

// Mock data for demonstration
const departments = [
  {
    id: 1,
    corporateObjective:
      "Deploy a learning management system across 3 departments",
    departmentObjective:
      "Deploy a learning management system across 3 departments",
    kpi: "200+ employees trained in Q1",
    baseline: 12,
    weight: "10%",
    target: 45,
  },
  {
    id: 2,
    corporateObjective: "Implement a training platform throughout...",
    departmentObjective: "Implement a training platform throughout...",
    kpi: "Over 200 staff members completed training in the first month",
    baseline: 12,
    weight: "10%",
    target: 40,
  },
  {
    id: 3,
    corporateObjective:
      "Deploy a learning management system across 3 departments",
    departmentObjective:
      "Deploy a learning management system across 3 departments",
    kpi: "Feedback turnaround time reduced to < 3 days",
    baseline: 13,
    weight: "20%",
    target: 35,
  },
  {
    id: 4,
    corporateObjective: "Increase employee engagement across all departments",
    departmentObjective: "Launch quarterly engagement surveys",
    kpi: "Employee satisfaction score increased by 15%",
    baseline: 15,
    weight: "40%",
    target: 45,
  },
  {
    id: 5,
    corporateObjective: "Expand leadership development programs",
    departmentObjective: "Implement new leadership workshops",
    kpi: "New training modules launched for leadership development",
    baseline: 14,
    weight: "30%",
    target: 50,
  },
  {
    id: 6,
    corporateObjective: "Improve operational efficiency",
    departmentObjective: "Automate routine reporting tasks",
    kpi: "Monthly report generation time reduced by 50%",
    baseline: 10,
    weight: "15%",
    target: 20,
  },
  {
    id: 7,
    corporateObjective: "Enhance customer service responsiveness",
    departmentObjective: "Implement new ticketing system",
    kpi: "Average response time reduced to 2 hours",
    baseline: 8,
    weight: "25%",
    target: 18,
  },
  {
    id: 8,
    corporateObjective: "Increase digital adoption",
    departmentObjective: "Roll out new mobile app to all staff",
    kpi: "App adoption rate reaches 80% by Q3",
    baseline: 5,
    weight: "20%",
    target: 80,
  },
  {
    id: 9,
    corporateObjective: "Strengthen compliance training",
    departmentObjective: "Mandatory annual compliance modules",
    kpi: "100% staff completion of compliance training",
    baseline: 100,
    weight: "10%",
    target: 100,
  },
  {
    id: 10,
    corporateObjective: "Reduce operational costs",
    departmentObjective: "Optimize supply chain processes",
    kpi: "Operational costs reduced by 12%",
    baseline: 12,
    weight: "18%",
    target: 10,
  },
];

const DepartmentTable = () => {
  const router = useRouter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>CORPORATE OBJECTIVE</TableHead>
          <TableHead>DEPARTMENT OBJECTIVE</TableHead>
          <TableHead>KPI</TableHead>
          <TableHead>BASELINE</TableHead>
          <TableHead>WEIGHT</TableHead>
          <TableHead>TARGET</TableHead>
          <TableHead>ACTION</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {departments.map((dept, idx) => (
          <TableRow
            key={dept.id}
            onClick={() => router.push(`/dashboard/departments/${dept.id}`)}
            className={`${
              idx % 2 === 1 ? "bg-muted/50" : "bg-white dark:bg-muted"
            } cursor-pointer hover:bg-muted/70 transition-colors`}
          >
            <TableCell>{dept.corporateObjective}</TableCell>
            <TableCell>{dept.departmentObjective}</TableCell>
            <TableCell>{dept.kpi}</TableCell>
            <TableCell>{dept.baseline}</TableCell>
            <TableCell>{dept.weight}</TableCell>
            <TableCell>{dept.target}</TableCell>
            <TableCell>
              {/* Placeholder for expand/collapse action */}
              <button className="rounded-full border p-1 px-2 text-xs">
                ▼
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DepartmentTable;
