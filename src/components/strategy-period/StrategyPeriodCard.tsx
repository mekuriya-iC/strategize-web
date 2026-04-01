"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";
import { StrategicPeriod } from "@/types/graphql";
import DeleteStrategyPeriodDialog from "./DeleteStrategyPeriodDialog";
import { X } from "lucide-react";

interface StrategyPeriodCardProps {
  icon: ReactNode;
  title: string;
  date: string;
  onClick?: () => void;
  selected?: boolean;
  period?: StrategicPeriod;
  onDelete?: () => Promise<void>;
}

export default function StrategyPeriodCard({
  icon,
  title,
  date,
  onClick,
  selected = false,
  period,
  onDelete,
}: StrategyPeriodCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card
        className={`bg-white border border-[#E2E8F0] rounded-xl shadow-[0_3.6px_90px_4.5px_rgba(0,0,0,0.07)] flex flex-col items-center p-8 transition-all gap-2 hover:shadow-lg cursor-pointer relative ${
          selected ? "ring-2 ring-[#3838EC]" : ""
        }`}
        onClick={onClick}
      >
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="mb-5 text-5xl">{icon}</div>
        <div className="font-semibold text-lg text-primary">{title}</div>
        <div className="text-sm text-[#09090B] mb-4">{date}</div>
        {period && (
          <div className="text-xs text-gray-500 mb-4 text-center">
            Duration: {period.length} {period.length === 1 ? "year" : "years"}
            <br />
            Created: {new Date(period.createdAt).toLocaleDateString()}
          </div>
        )}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="w-full bg-primary cursor-pointer text-white hover:bg-primary/90"
        >
          Choose
        </Button>
      </Card>

      <DeleteStrategyPeriodDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete!}
        periodTitle={title}
      />
    </>
  );
}
