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
import { useRouter } from "next/navigation";
import { useStrategicPeriodMutations } from "@/hooks/useStrategicPeriodMutations";
import { toast } from "sonner";
import { useStrategicPeriodStore } from "@/stores";

export default function AddNewStrategyForm() {
  const router = useRouter();
  const { createStrategicPeriod, loading, error } =
    useStrategicPeriodMutations();
  const { setSelectedPeriod } = useStrategicPeriodStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeline, setTimeline] = useState<string>("3");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error("Please select a start date");
      return;
    }

    setIsSubmitting(true);

    try {
      const startDate = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      const length = parseFloat(timeline);

      const newPeriod = await createStrategicPeriod({
        input: {
          startDate,
          length,
        },
      });

      toast.success("Strategic period created successfully!");

      // Update store with the newly created period and redirect to list page
      if (newPeriod) {
        setSelectedPeriod(newPeriod);
      }
      router.push("/strategy-period");
    } catch (err) {
      console.error("Error creating strategic period:", err);
      toast.error("Failed to create strategic period. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm flex flex-col gap-6 items-center"
    >
      <div className="w-full">
        <Label className="mb-2 block">Select Start Date</Label>
        <div className="w-full">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="w-full rounded-md border"
            disabled={(date) => date < new Date()}
          />
        </div>
      </div>
      <div className="w-full">
        <Label className="mb-2 block">Duration (Years)</Label>
        <Select value={timeline} onValueChange={setTimeline}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Year</SelectItem>
            <SelectItem value="2">2 Years</SelectItem>
            <SelectItem value="3">3 Years</SelectItem>
            <SelectItem value="5">5 Years</SelectItem>
            <SelectItem value="10">10 Years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="w-full text-red-500 text-sm text-center">
          {error.message ||
            "An error occurred while creating the strategic period"}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || isSubmitting || !date}
        className="w-full bg-[#3838EC] hover:bg-[#2e2ed6] text-white text-lg font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading || isSubmitting ? "Creating..." : "+ Add"}
      </Button>
    </form>
  );
}
