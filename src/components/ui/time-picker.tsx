"use client";

import { cn } from "@/lib/utils";

interface TimeValue {
  hour: string;
  minute: string;
  period: "AM" | "PM";
}

interface TimePickerProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  onClose: () => void;
}

export function TimePicker({ value, onChange, onClose }: TimePickerProps) {
  // ✅ Convert to 24hr for native input
  const to24Hour = (h: string, period: "AM" | "PM") => {
    let hour = parseInt(h);
    if (period === "AM" && hour === 12) hour = 0;
    if (period === "PM" && hour !== 12) hour += 12;
    return hour.toString().padStart(2, "0");
  };

  // ✅ Convert from 24hr back to 12hr
  const to12Hour = (time24: string) => {
    const [h, m] = time24.split(":");
    let hour = parseInt(h);
    const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
    if (hour === 0) hour = 12;
    if (hour > 12) hour -= 12;
    return {
      hour: hour.toString().padStart(2, "0"),
      minute: m,
      period,
    };
  };

  const currentTime24 = `${to24Hour(value.hour, value.period)}:${value.minute}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = to12Hour(e.target.value);
    onChange(result);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-[220px]">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Select Time
      </p>

      {/* ✅ Native time input — zero conflict with Dialog */}
      <input
        type="time"
        value={currentTime24}
        onChange={handleChange}
        className={cn(
          "w-full h-12 px-3 rounded-lg border border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
          "text-lg font-semibold text-center",
          "focus:outline-none focus:border-[#3838EC] focus:ring-2 focus:ring-[#3838EC]/20",
          "[color-scheme:light] dark:[color-scheme:dark]"
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />

      {/* Display */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-2xl font-bold text-[#3838EC] tabular-nums">
          {value.hour}:{value.minute}
        </span>
        <div className="flex flex-col gap-1">
          {(["AM", "PM"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange({ ...value, period: p });
              }}
              className={cn(
                "px-2 py-0.5 text-xs font-semibold rounded transition-colors",
                value.period === p
                  ? "bg-[#3838EC] text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="px-3 py-1.5 text-sm font-medium bg-[#3838EC] hover:bg-[#2d2dbd] text-white rounded transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}