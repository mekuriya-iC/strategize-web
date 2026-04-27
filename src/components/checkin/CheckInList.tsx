"use client";

import { format } from "date-fns";
import { CheckInItem } from "./CheckInItem";

interface CheckIn {
  id: string;
  taskType: string;
  task: string;
  description: string;
  startTime: string;
  endTime: string;
  checkoutStatus: string;
  isKpiMet: boolean;
  isInitiativeMet: boolean;
  isSelfDevComplete: boolean;
  attachment?: string;
  remark?: string;
  createdAt: string;
}

interface CheckInListProps {
  checkins: CheckIn[];
  onRefetch: () => void;
}

export function CheckInList({ checkins, onRefetch }: CheckInListProps) {
  // Group checkins by date
  const groupedCheckins = checkins.reduce((acc, checkin) => {
    const date = format(new Date(checkin.createdAt), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(checkin);
    return acc;
  }, {} as Record<string, CheckIn[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedCheckins).map(([date, items]) => (
        <div key={date} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {format(new Date(date), "EEEE, MMMM d, yyyy")}
          </h3>
          <div className="space-y-3">
            {items.map((checkin) => (
              <CheckInItem
                key={checkin.id}
                checkin={checkin}
                onRefetch={onRefetch}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
