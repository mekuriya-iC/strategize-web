import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";

// Define table header type
export interface HeaderColumn {
  key: string;
  label: string;
}

// Props interface for the component
interface ReusableTableHeaderProps {
  headers: HeaderColumn[];
  className?: string;
  headerClassName?: string;
}

const ReusableTableHeader: React.FC<ReusableTableHeaderProps> = ({
  headers,
  className = "border-none",
  headerClassName = "text-[#9E9E9E] text-[14px] px-6 py-3",
}) => {
  return (
    <TableHeader className={className}>
      <TableRow>
        {headers.map((header) => (
          <TableHead key={header.key} className={headerClassName}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
};

export default ReusableTableHeader;
