"use client";

import { format } from "date-fns";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  hour: number;
  isAvailable: boolean;
  taskTitle?: string;
  taskStart?: Date;
  taskEnd?: Date;
}

interface TimeAvailabilityViewProps {
  date: Date;
  existingTasks?: Array<{
    taskTitle: string;
    taskStartDate: string;
    taskEndDate: string;
  }>;
  selectedStart?: Date;
  selectedEnd?: Date;
  onTimeSlotClick?: (hour: number) => void;
}

export function TimeAvailabilityView({
  date,
  existingTasks = [],
  selectedStart,
  selectedEnd,
  onTimeSlotClick,
}: TimeAvailabilityViewProps) {
  // Generate hourly time slots from 7 AM to 7 PM (12 hours)
  const workDayStart = 7;
  const workDayEnd = 19;
  const totalHours = workDayEnd - workDayStart;

  // Build time slots with availability
  const timeSlots: TimeSlot[] = [];
  for (let hour = workDayStart; hour < workDayEnd; hour++) {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    // Check if this slot conflicts with any existing task
    const conflictingTask = existingTasks.find((task) => {
      const taskStart = new Date(task.taskStartDate);
      const taskEnd = new Date(task.taskEndDate);
      return taskStart < slotEnd && taskEnd > slotStart;
    });

    timeSlots.push({
      hour,
      isAvailable: !conflictingTask,
      taskTitle: conflictingTask?.taskTitle,
      taskStart: conflictingTask ? new Date(conflictingTask.taskStartDate) : undefined,
      taskEnd: conflictingTask ? new Date(conflictingTask.taskEndDate) : undefined,
    });
  }

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  const formatTimeRange = (start: Date, end: Date) => {
    const startHour = start.getHours();
    const startMin = start.getMinutes();
    const endHour = end.getHours();
    const endMin = end.getMinutes();

    const formatT = (h: number, m: number) => {
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 || 12;
      return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
    };

    return `${formatT(startHour, startMin)} - ${formatT(endHour, endMin)}`;
  };

  const isHourInRange = (hour: number) => {
    if (!selectedStart || !selectedEnd) return false;
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    return selectedStart < slotEnd && selectedEnd > slotStart;
  };

  const availableCount = timeSlots.filter((slot) => slot.isAvailable).length;
  const busyCount = timeSlots.filter((slot) => !slot.isAvailable).length;

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-4 dark:border-zinc-700 dark:from-zinc-900 dark:to-blue-950/30">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Schedule for {format(date, "EEEE, MMM d, yyyy")}
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
            Click on available time slots to quickly schedule your task
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Available</p>
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {availableCount}h
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/50">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Busy</p>
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {busyCount}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline view */}
      <div className="space-y-1">
        {timeSlots.map((slot) => {
          const isSelected = isHourInRange(slot.hour);
          const isClickable = slot.isAvailable && onTimeSlotClick;

          return (
            <div
              key={slot.hour}
              onClick={() => isClickable && onTimeSlotClick(slot.hour)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg border p-3 transition-all",
                slot.isAvailable
                  ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40"
                  : "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20",
                isSelected &&
                  "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900",
                isClickable && "cursor-pointer",
              )}
            >
              {/* Time label */}
              <div className="flex w-28 items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  {formatTime(slot.hour)}
                </span>
              </div>

              {/* Status indicator */}
              <div className="flex-1">
                {slot.isAvailable ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">
                      Available
                    </span>
                    {isSelected && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Selected
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-rose-500 dark:bg-rose-400" />
                      <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
                        Busy
                      </span>
                    </div>
                    {slot.taskTitle && (
                      <div className="ml-4 text-xs text-slate-600 dark:text-zinc-400">
                        {slot.taskTitle}
                        {slot.taskStart && slot.taskEnd && (
                          <span className="ml-2 text-slate-500 dark:text-zinc-500">
                            ({formatTimeRange(slot.taskStart, slot.taskEnd)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Click hint for available slots */}
              {isClickable && !isSelected && (
                <div className="text-xs text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-400">
                  Click to use
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-zinc-400">
            Available time slots
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="text-slate-600 dark:text-zinc-400">
            Scheduled tasks
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-blue-500" />
          <span className="text-slate-600 dark:text-zinc-400">
            Your selection
          </span>
        </div>
      </div>
    </div>
  );
}
