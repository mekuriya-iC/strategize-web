"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

export default function AddNewStrategyForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeline, setTimeline] = useState<string>("3 Years");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: handle form submission
    alert(`Date: ${date?.toLocaleDateString()} | Timeline: ${timeline}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm flex flex-col gap-6 items-center"
    >
      <div className="w-full">
        <Label className="mb-2 block">Select Date Period</Label>
        <div className="w-full">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="w-full rounded-md border"
          />
        </div>
      </div>
      <div className="w-full">
        <Label className="mb-2 block">Timeline</Label>
        <Select value={timeline} onValueChange={setTimeline}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select timeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3 Years">3 Years</SelectItem>
            <SelectItem value="5 Years">5 Years</SelectItem>
            <SelectItem value="10 Years">10 Years</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        className="w-full bg-[#3838EC] hover:bg-[#2e2ed6] text-white text-lg font-semibold"
      >
        + Add
      </Button>
    </form>
  );
}
