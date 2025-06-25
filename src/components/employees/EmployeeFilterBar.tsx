import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

const EmployeeFilterBar = () => {
  return (
    <div className="flex flex-col md:flex-row rounded-lg gap-2 w-full">
      {/* Search Icon */}
      <div className="flex border items-center gap-2 rounded-sm w-full md:w-[35%] ">
        <Search className="h-4 w-4 text-gray-400 ml-3" />

        {/* Search Input */}
        <Input
          type="text"
          placeholder="Search..."
          className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
        />
      </div>

      {/* Divider */}

      {/* Filter Dropdown */}
      <Select>
        <SelectTrigger className="  bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none rounded-sm">
          <Filter className="h-4 w-4 text-gray-400 mr-1" />
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default EmployeeFilterBar;
