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
import { useRouter } from "next/navigation";

interface Division {
  id: string;
  name: string;
  createdBy: string;
  createdOn: string;
  managedBy: string;
  departments: number;
}

interface DivisionTableProps {
  divisions?: Division[];
}

const mockDivisions: Division[] = [
  {
    id: "1",
    name: "Operation Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 23,
  },
  ...Array.from({ length: 9 }).map((_, i) => ({
    id: `${i + 2}`,
    name: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: Math.floor(Math.random() * 80) + 1,
  })),
];

export default function DivisionTable({
  divisions = mockDivisions,
}: DivisionTableProps) {
  const router = useRouter();
  return (
    <div className="overflow-x-auto rounded-xl shadow bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="py-4 text-base font-semibold">
              Division Name
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
              Departments
            </TableHead>
            <TableHead className="py-4 text-base font-semibold">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {divisions.map((div, idx) => (
            <TableRow
              key={div.id}
              className={idx % 2 === 0 ? "bg-muted/30" : "bg-white"}
            >
              <TableCell className="py-4 text-base font-medium">
                {div.name}
              </TableCell>
              <TableCell className="py-4 text-base">{div.createdBy}</TableCell>
              <TableCell className="py-4 text-base">{div.createdOn}</TableCell>
              <TableCell className="py-4 text-base">{div.managedBy}</TableCell>
              <TableCell className="py-4 text-base">
                {div.departments}
              </TableCell>
              <TableCell className="py-4 text-base">
                <Button
                  variant="link"
                  className="text-primary px-0 h-auto"
                  onClick={() => router.push(`/dashboard/divisions/${div.id}`)}
                >
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
