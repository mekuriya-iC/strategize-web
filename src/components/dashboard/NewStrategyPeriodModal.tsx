"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfDay,
} from "date-fns";

// ─── Constants ───────────────────────────────────────────────────────────────

const TIMELINES = [
  { value: 1, label: "1 Year" },
  { value: 2, label: "2 Years" },
  { value: 3, label: "3 Years" },
  { value: 4, label: "4 Years" },
  { value: 5, label: "5 Years" },
] as const;

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const DEFAULT_TIMELINE = 3;

// ─── Types ───────────────────────────────────────────────────────────────────

type TimelineValue = (typeof TIMELINES)[number]["value"];

interface NewStrategyPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (startDate: Date, timelineYears: number) => void;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getCalendarDays(month: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewStrategyPeriodModal({
  isOpen,
  onClose,
  onAdd,
}: NewStrategyPeriodModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [timeline, setTimeline] = useState<TimelineValue>(DEFAULT_TIMELINE);

  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const today = startOfDay(new Date());
      setSelectedDate(today);
      setCurrentMonth(startOfMonth(today));
      setTimeline(DEFAULT_TIMELINE);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleDateClick = useCallback((day: Date) => {
    setSelectedDate(startOfDay(day));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return;
    onAdd(selectedDate, timeline);
    onClose();
  }, [selectedDate, timeline, onAdd, onClose]);

  if (!isOpen || !mounted) return null;

  const calendarDays = getCalendarDays(currentMonth);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 isolate"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-200 dark:border-gray-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          type="button"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <h2
            id={titleId}
            className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center"
          >
            New Strategy Period
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 pb-8 space-y-6">

          {/* ── Date Picker Container ── */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Start Date
            </label>

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-900/20">
              
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                  type="button"
                >
                  <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                </button>

                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 min-w-[120px] text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </span>

                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                  type="button"
                >
                  <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="p-3">
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEK_DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 h-8 flex items-center justify-center"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day cells - Fixed height to prevent "overlay" or layout jumping */}
                <div className="grid grid-cols-7 gap-1 min-h-[240px]">
                  {calendarDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);

                    return (
                      <div key={day.toISOString()} className="aspect-square flex items-center justify-center">
                        <button
                          onClick={() => handleDateClick(day)}
                          type="button"
                          className={`
                            w-full h-full max-w-[36px] max-h-[36px] text-sm rounded-lg transition-all flex items-center justify-center
                            ${isSelected
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105 z-10"
                              : isTodayDate && isCurrentMonth
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800"
                              : isCurrentMonth
                              ? "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm"
                              : "text-gray-300 dark:text-gray-600 opacity-50"
                            }
                          `}
                        >
                          {format(day, "d")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Timeline Selector ── */}
          <div className="space-y-3">
            <label
              htmlFor="timeline-select"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Strategy Duration
            </label>
            <div className="relative">
              <select
                id="timeline-select"
                value={timeline}
                onChange={(e) => setTimeline(Number(e.target.value) as TimelineValue)}
                className="
                  w-full px-4 py-3 appearance-none
                  border border-gray-200 dark:border-gray-700 rounded-xl
                  bg-gray-50/50 dark:bg-gray-900/20
                  text-gray-900 dark:text-gray-100 text-sm font-medium
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  cursor-pointer transition-all
                "
              >
                {TIMELINES.map((option) => (
                  <option key={option.value} value={option.value} className="dark:bg-[#18181b]">
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>

          {/* ── Submit Button ── */}
          <button
            onClick={handleSubmit}
            type="button"
            className="
              w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98]
              text-white font-bold py-4 rounded-xl
              transition-all flex items-center justify-center gap-2
              shadow-lg shadow-blue-500/25
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            "
          >
            <Plus size={20} strokeWidth={3} />
            Create Period
          </button>

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}