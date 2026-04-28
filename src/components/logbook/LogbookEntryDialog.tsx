"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import {
  CREATE_LOGBOOK_ENTRY,
  UPDATE_LOGBOOK_ENTRY,
} from "@/lib/graphql/mutations/logbook";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, UploadIcon, XIcon, ClockIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

interface LogbookEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingEntry?: any;
}

type TimeValue = { hour: string; minute: string; period: "AM" | "PM" };

export function LogbookEntryDialog({
  open,
  onOpenChange,
  onSuccess,
  editingEntry,
}: LogbookEntryDialogProps) {
  // Mutations
  const [createEntryMutation, { loading: creating }] = useMutation(CREATE_LOGBOOK_ENTRY, {
    refetchQueries: ["GetLogbookEntries"],
  });

  const [updateEntryMutation, { loading: updating }] = useMutation(UPDATE_LOGBOOK_ENTRY, {
    refetchQueries: ["GetLogbookEntries"],
  });

  const mutationLoading = creating || updating;

  const today = new Date();

  const [entryDate, setEntryDate] = useState<Date>(today);
  const [entryTime, setEntryTime] = useState<TimeValue>({
    hour: "09",
    minute: "00",
    period: "AM",
  });
  const [activity, setActivity] = useState("");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingEntry && open) {
      const entryDateTime = new Date(editingEntry.entryDate);
      setEntryDate(entryDateTime);
      setEntryTime({
        hour: entryDateTime.getHours() > 12 
          ? String(entryDateTime.getHours() - 12).padStart(2, '0') 
          : String(entryDateTime.getHours() || 12).padStart(2, '0'),
        minute: String(entryDateTime.getMinutes()).padStart(2, '0'),
        period: entryDateTime.getHours() >= 12 ? "PM" : "AM",
      });
      setActivity(editingEntry.activity || "");
      setDescription(editingEntry.description || "");
      setOutcome(editingEntry.outcome || "");
    } else if (!open) {
      resetForm();
    }
  }, [editingEntry, open]);

  const buildDateTime = (date: Date, time: TimeValue): Date => {
    const dt = new Date(date);
    let hour = parseInt(time.hour);
    if (time.period === "PM" && hour !== 12) hour += 12;
    if (time.period === "AM" && hour === 12) hour = 0;
    dt.setHours(hour, parseInt(time.minute), 0, 0);
    return dt;
  };

  const handleSubmit = async () => {
    if (!activity || !entryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const entryData = {
        activity: activity.trim(),
        description: description.trim() || null,
        outcome: outcome.trim() || null,
        entryDate: buildDateTime(entryDate, entryTime).toISOString(),
        attachmentUrl: attachment?.name || null,
      };

      if (editingEntry) {
        // Update existing entry
        await updateEntryMutation({
          variables: {
            input: {
              logbookEntryId: editingEntry.id,
              ...entryData,
            },
          },
        });
        toast.success("Logbook entry updated successfully");
      } else {
        // Create new entry
        await createEntryMutation({
          variables: {
            input: entryData,
          },
        });
        toast.success("Logbook entry created successfully");
      }

      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error("Logbook entry operation error:", error);
      toast.error(error.message || `Failed to ${editingEntry ? "update" : "create"} entry`);
    }
  };

  const resetForm = () => {
    const newToday = new Date();
    setEntryDate(newToday);
    setEntryTime({ hour: "09", minute: "00", period: "AM" });
    setActivity("");
    setDescription("");
    setOutcome("");
    setAttachment(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-xl font-semibold">
            {editingEntry ? "Edit Logbook Entry" : "Add Logbook Entry"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] px-6 py-6">
          <div className="space-y-5">
            {/* Entry Date & Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Entry Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 justify-start text-sm font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                      <span className="truncate">
                        {format(entryDate, "MMM d, yyyy")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    style={{ zIndex: 99999 }}
                  >
                    <Calendar
                      mode="single"
                      selected={entryDate}
                      onSelect={(d) => {
                        if (d) {
                          setEntryDate(d);
                          setDateOpen(false);
                        }
                      }}
                      disabled={(d) =>
                        d > new Date() || d < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>

                <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-32 h-10 justify-start text-sm font-normal shrink-0"
                    >
                      <ClockIcon className="mr-1.5 h-4 w-4 text-gray-500 shrink-0" />
                      <span className="tabular-nums text-xs">
                        {entryTime.hour}:{entryTime.minute} {entryTime.period}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    style={{ zIndex: 99999 }}
                  >
                    <TimePicker
                      value={entryTime}
                      onChange={setEntryTime}
                      onClose={() => setTimeOpen(false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-2">
              <Label htmlFor="activity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Activity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="activity"
                placeholder="Enter activity title..."
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </Label>
              <Textarea
                placeholder="Describe what you did..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] text-sm resize-none"
              />
            </div>

            {/* Outcome */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Outcome/Result
              </Label>
              <Textarea
                placeholder="What was the outcome or result..."
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="min-h-[100px] text-sm resize-none"
              />
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Attachment (Optional)
              </Label>
              <label
                htmlFor="file-upload-logbook"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition-colors",
                  "border-2 border-dashed border-gray-300 dark:border-gray-600",
                  "hover:border-[#3838EC] hover:bg-blue-50/30 dark:hover:bg-blue-950/10"
                )}
              >
                <input
                  id="file-upload-logbook"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setAttachment(e.target.files[0]);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <UploadIcon className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Click or drag here to upload
                </span>
              </label>
              {attachment && (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                    {attachment.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-red-400 hover:text-red-600 shrink-0"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutationLoading}
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutationLoading}
            className="sm:w-auto bg-[#3838EC] hover:bg-[#2d2dbd] text-white"
          >
            {mutationLoading 
              ? (editingEntry ? "Updating..." : "Adding...") 
              : (editingEntry ? "Update Entry" : "Add Entry")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
