"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface KPIFormHeaderProps {
  isEditing: boolean;
  onCancel: () => void;
}

export function KPIFormHeader({ isEditing, onCancel }: KPIFormHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="icon" onClick={onCancel}>
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1 className="text-2xl md:text-3xl font-bold text-[#3F3F46]">
        {isEditing ? "Edit KPI" : "Add New KPI"}
      </h1>
    </div>
  );
}

