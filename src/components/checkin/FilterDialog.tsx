"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, XIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  objective: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  attachment: "all" | "yes" | "no";
  checkoutStatus: string[];
}

const CHECKOUT_STATUS_OPTIONS = [
  { value: "DONE", label: "Done", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
  { value: "NOT_DONE", label: "Not Done", color: "bg-red-100 text-red-800" },
  { value: "POSTPONED", label: "Postponed", color: "bg-yellow-100 text-yellow-800" },
];

const OBJECTIVES = [
  { value: "kpi_unmet", label: "KPI Unmet" },
  { value: "initiative_fulfilled", label: "Initiative Fulfilled" },
  { value: "initiative_unmet", label: "Initiative Unmet" },
  { value: "kpi_fulfilled", label: "KPI Fulfilled" },
];

export function FilterDialog({
  open,
  onOpenChange,
  onApplyFilters,
  currentFilters,
}: FilterDialogProps) {
  const [objective, setObjective] = useState(currentFilters.objective);
  const [startDate, setStartDate] = useState<Date | undefined>(currentFilters.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(currentFilters.endDate);
  const [attachment, setAttachment] = useState<"all" | "yes" | "no">(currentFilters.attachment);
  const [checkoutStatus, setCheckoutStatus] = useState<string[]>(currentFilters.checkoutStatus);

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Update local state when currentFilters change
  useEffect(() => {
    setObjective(currentFilters.objective);
    setStartDate(currentFilters.startDate);
    setEndDate(currentFilters.endDate);
    setAttachment(currentFilters.attachment);
    setCheckoutStatus(currentFilters.checkoutStatus);
  }, [currentFilters, open]);

  const handleReset = () => {
    setObjective("");
    setStartDate(undefined);
    setEndDate(undefined);
    setAttachment("all");
    setCheckoutStatus([]);
  };

  const handleApply = () => {
    onApplyFilters({
      objective,
      startDate,
      endDate,
      attachment,
      checkoutStatus,
    });
    onOpenChange(false);
  };

  const toggleCheckoutStatus = (status: string) => {
    setCheckoutStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const removeCheckoutStatus = (status: string) => {
    setCheckoutStatus((prev) => prev.filter((s) => s !== status));
  };

  const activeFiltersCount = [
    objective,
    startDate,
    endDate,
    attachment !== "all",
    checkoutStatus.length > 0,
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-[400px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <SheetTitle className="text-xl font-semibold">Filter</SheetTitle>
        </SheetHeader>

        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
          {/* Objective */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Objective
            </Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select objective(s)" />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVES.map((obj) => (
                  <SelectItem key={obj.value} value={obj.value}>
                    {obj.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range
            </Label>
            <div className="flex gap-2">
              {/* Start Date */}
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MM/dd/yyyy") : "12/12/2025"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" style={{ zIndex: 99999 }}>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setStartDateOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>

              {/* End Date */}
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MM/dd/yyyy") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" style={{ zIndex: 99999 }}>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndDateOpen(false);
                    }}
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Attachment */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachment
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attachment"
                  value="all"
                  checked={attachment === "all"}
                  onChange={(e) => setAttachment(e.target.value as "all")}
                  className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">All</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attachment"
                  value="yes"
                  checked={attachment === "yes"}
                  onChange={(e) => setAttachment(e.target.value as "yes")}
                  className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attachment"
                  value="no"
                  checked={attachment === "no"}
                  onChange={(e) => setAttachment(e.target.value as "no")}
                  className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
              </label>
            </div>
          </div>

          {/* Checkout Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Checkout Status
            </Label>
            
            {/* Selected Status Badges */}
            {checkoutStatus.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {checkoutStatus.map((status) => {
                  const statusOption = CHECKOUT_STATUS_OPTIONS.find((opt) => opt.value === status);
                  return (
                    <Badge
                      key={status}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1",
                        statusOption?.color
                      )}
                    >
                      {statusOption?.label}
                      <button
                        onClick={() => removeCheckoutStatus(status)}
                        className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Status Dropdown */}
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !checkoutStatus.includes(value)) {
                  toggleCheckoutStatus(value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {CHECKOUT_STATUS_OPTIONS.map((status) => (
                  <SelectItem
                    key={status.value}
                    value={status.value}
                    disabled={checkoutStatus.includes(status.value)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          status.value === "DONE" && "bg-green-500",
                          status.value === "CANCELLED" && "bg-gray-500",
                          status.value === "NOT_DONE" && "bg-red-500",
                          status.value === "POSTPONED" && "bg-yellow-500"
                        )}
                      />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-900"
          >
            Reset({activeFiltersCount})
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white px-8"
          >
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
