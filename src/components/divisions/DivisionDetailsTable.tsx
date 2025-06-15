import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Department {
  id: string;
  name: string;
  createdBy: string;
  createdOn: string;
  managedBy: string;
  division: string;
  members: number;
}

interface DivisionDetailsTableProps {
  departments?: Department[];
}

const mockDepartments: Department[] = [
  {
    id: "1",
    name: "Research and Advisory Solution",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 6,
  },
  {
    id: "2",
    name: "Learning solutions",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 3,
  },
  {
    id: "3",
    name: "Knowledge Sharing Platform",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Lorem Ipsum Division",
    members: 8,
  },
];

export default function DivisionDetailsTable({
  departments = mockDepartments,
}: DivisionDetailsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl shadow bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="py-4 text-base font-semibold">
              Department
            </TableHead>
            <TableHead className="py-4 text-base font-semibold">
              Created By
            </TableHead>
            <TableHead className="py-4 text-base font-semibold">
              Created On
            </TableHead>
            <TableHead className="py-4 text-base font-semibold">
              Managed By
            </TableHead>
            <TableHead className="py-4 text-base font-semibold">
              Division
            </TableHead>
            <TableHead className="py-4 text-base font-semibold">
              Members
            </TableHead>
            <TableHead className="py-4 text-base font-semibold">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept, idx) => (
            <TableRow
              key={dept.id}
              className={idx % 2 === 0 ? "bg-muted/30" : "bg-white"}
            >
              <TableCell className="py-4 text-base font-medium">
                {dept.name}
              </TableCell>
              <TableCell className="py-4 text-base">{dept.createdBy}</TableCell>
              <TableCell className="py-4 text-base">{dept.createdOn}</TableCell>
              <TableCell className="py-4 text-base">{dept.managedBy}</TableCell>
              <TableCell className="py-4 text-base">{dept.division}</TableCell>
              <TableCell className="py-4 text-base">{dept.members}</TableCell>
              <TableCell className="py-4 text-base">
                <Button variant="link" className="text-primary px-0 h-auto">
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
