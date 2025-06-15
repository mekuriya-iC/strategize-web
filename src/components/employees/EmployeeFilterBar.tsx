import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const EmployeeFilterBar = () => {
  return (
    <div className="flex gap-2">
      <Input type="text" placeholder="Search..." className="w-48" disabled />
      <Select disabled>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default EmployeeFilterBar;
