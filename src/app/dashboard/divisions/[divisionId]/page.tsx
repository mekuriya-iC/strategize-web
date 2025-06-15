"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DivisionDetailsTable from "@/components/divisions/DivisionDetailsTable";
import { useRouter } from "next/navigation";
// TODO: import Pagination when implemented

export default function DivisionDetailsPage() {
  // TODO: get division name from params or mock
  const divisionName = "Operation Division";
  const router = useRouter();
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />     
        </Button>
        <h1 className="text-2xl font-bold">{divisionName}</h1>
        <Button className="ml-auto">+ Add Department</Button>
      </div>
      {/* Division Details Table */}
      <div className="mb-4">
        <DivisionDetailsTable />
      </div>
      {/* TODO: Pagination */}
      <div className="flex justify-end">
        {/* <Pagination /> */}
        <div className="text-muted-foreground">Pagination placeholder</div>
      </div>
    </div>
  );
}
