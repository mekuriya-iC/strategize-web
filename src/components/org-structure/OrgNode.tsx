"use client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface OrgNodeProps {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
  level: number;
  onAddChild?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function OrgNode({
  name,
  subtitle,
  color,
  level,
  onAddChild,
  onEdit,
  onDelete,
}: OrgNodeProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="relative group">
        <div
          className="rounded-lg px-6 py-3 min-w-[160px] text-center shadow-md transition-all hover:shadow-lg"
          style={{ backgroundColor: color }}
        >
          <div className="text-white font-medium text-sm">{name}</div>
          {subtitle && (
            <div className="text-white/80 text-xs mt-1">{subtitle}</div>
          )}
          
          {/* Action Buttons - Show on Hover */}
          {level > 0 && (
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              {onEdit && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-white shadow-md hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  type="button"
                >
                  <Pencil size={12} className="text-gray-700" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-white shadow-md hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  type="button"
                >
                  <Trash2 size={12} className="text-red-500" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Add Child Button */}
        {onAddChild && (
          <div className="flex justify-center mt-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-full bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
              }}
              type="button"
            >
              <Plus size={14} className="text-gray-600" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
