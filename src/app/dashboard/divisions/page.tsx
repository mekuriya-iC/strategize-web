"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import DivisionTable from "@/components/divisions/DivisionTable";
import SearchAndFilterBar from "@/components/divisions/SearchAndFilterBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import AddDivisionDialog from "@/components/divisions/AddDivisionDialog";

// TODO: import Pagination when implemented

export default function DivisionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [divisionName, setDivisionName] = useState("");
  const [divisionManager, setDivisionManager] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);

  // Mock data for managers and departments
  const managers = ["John Doe", "Jane Smith", "Alice Johnson"];
  const allDepartments = ["Research and Advisory Solution", "Learning Solution", "knowledge Sharing platform", "Marketing"];

  const handleAddDivision = () => {
    // TODO: handle form submission
    setDialogOpen(false);
    setDivisionName("");
    setDivisionManager("");
    setDepartments([]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Divisions</h1>
        <Button className="ml-auto" onClick={() => setDialogOpen(true)}>
          + Add Division
        </Button>
      </div>
      {/* Add Division Dialog */}
      <AddDivisionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        divisionName={divisionName}
        setDivisionName={setDivisionName}
        divisionManager={divisionManager}
        setDivisionManager={setDivisionManager}
        departments={departments}
        setDepartments={setDepartments}
        managers={managers}
        allDepartments={allDepartments}
        onSubmit={handleAddDivision}
      />
      {/* Search and Filter Bar */}
      <div className="mb-4">
        <SearchAndFilterBar
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>
      {/* Division Table */}
      <div className="mb-4">
        <DivisionTable />
      </div>
      {/* TODO: Pagination */}
      <div className="flex justify-end">
        {/* <Pagination /> */}
        <div className="text-muted-foreground">Pagination placeholder</div>
      </div>
    </div>
  );
}
