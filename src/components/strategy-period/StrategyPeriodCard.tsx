"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { ReactNode } from "react";
import DeleteStrategyPeriodDialog from "./DeleteStrategyPeriodDialog";
import { X } from "lucide-react";

interface StrategyPeriodCardProps {
  icon: ReactNode;
  title: string;
  context: string;
  date: string;
  onClick?: () => void;
  selected?: boolean;
  onDelete?: () => Promise<void>;
}

export default function StrategyPeriodCard({
  icon,
  title,
  context,
  date,
  onClick,
  selected = false,
  onDelete,
}: StrategyPeriodCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card
        className={`bg-white dark:bg-[#18181b] border-0 rounded-2xl shadow-sm hover:shadow-md flex flex-col items-center p-6 md:p-8 transition-all duration-200 cursor-pointer relative group ${
          selected ? "ring-2 ring-primary" : ""
        }`}
        onClick={onClick}
      >
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Icon */}
        <div className="mb-6 md:mb-8 flex items-center justify-center">
          {icon}
        </div>
        
        {/* Period name and date context */}
        <h3 className="font-semibold text-base md:text-lg text-primary mb-2 text-center">
          {title}
        </h3>
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-gray-300 mb-2">
          {context}
        </span>
        <p className="text-xs md:text-sm text-[#64748B] dark:text-gray-400 mb-6 text-center">
          {date}
        </p>
        
        {/* Choose Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-2.5 transition-colors"
        >
          Choose
        </Button>
      </Card>

      {onDelete && (
        <DeleteStrategyPeriodDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={onDelete}
          periodTitle={title}
        />
      )}
    </>
  );
}
