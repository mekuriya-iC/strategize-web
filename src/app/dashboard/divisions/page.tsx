"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import DivisionTable from "@/components/divisions/DivisionTable";
import SearchAndFilterBar from "@/components/divisions/SearchAndFilterBar";

// TODO: import Pagination when implemented

export default function DivisionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Divisions</h1>
        <Button className="ml-auto">+ Add Division</Button>
      </div>
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
