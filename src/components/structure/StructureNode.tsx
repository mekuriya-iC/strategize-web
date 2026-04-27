"use client";

import { useState } from "react";
import { Plus, Copy, Pencil, Trash2, ChevronDown } from "lucide-react";

interface StructureNodeProps {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
  level: number;
  isSelected?: boolean;
  onAddChild?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const roles = ["CEO", "Director", "Manager", "Supervisor", "Team Leader", "Employee", "Custom"];

export default function StructureNode({
  id,
  name,
  subtitle,
  color,
  level,
  isSelected = false,
  onAddChild,
  onEdit,
  onDelete,
  onDuplicate,
}: StructureNodeProps) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  return (
    <div className="flex flex-col items-center relative">
      {/* Node Card */}
      <div className="relative group">
        <div
          className={`rounded-lg px-6 py-3 min-w-[160px] text-center shadow-md transition-all hover:shadow-lg ${
            isSelected ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
          style={{ backgroundColor: color }}
        >
          <div className="text-white font-medium text-sm">{name}</div>
          {subtitle && (
            <div className="text-white/80 text-xs mt-1 flex items-center justify-center gap-1">
              <span>{subtitle}</span>
            </div>
          )}

          {/* Action Buttons - Show on Hover */}
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {onDuplicate && (
              <button
                className="h-6 w-6 rounded-full bg-white shadow-md hover:bg-gray-100 flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                type="button"
                title="Duplicate"
              >
                <Copy size={12} className="text-gray-700" />
              </button>
            )}
            {onEdit && (
              <button
                className="h-6 w-6 rounded-full bg-white shadow-md hover:bg-gray-100 flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRoleDropdown(!showRoleDropdown);
                }}
                type="button"
                title="Edit"
              >
                <Pencil size={12} className="text-gray-700" />
              </button>
            )}
            {onDelete && (
              <button
                className="h-6 w-6 rounded-full bg-white shadow-md hover:bg-red-50 flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                type="button"
                title="Delete"
              >
                <Trash2 size={12} className="text-red-500" />
              </button>
            )}
          </div>
        </div>

        {/* Role Dropdown */}
        {showRoleDropdown && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#18181b] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              Select Role
            </div>
            {roles.map((role) => (
              <button
                key={role}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => {
                  setShowRoleDropdown(false);
                  // Handle role selection
                }}
              >
                {role}
              </button>
            ))}
          </div>
        )}

        {/* Add Child Button */}
        {onAddChild && (
          <div className="flex justify-center mt-3">
            <button
              className="h-7 w-7 rounded-full bg-white border border-gray-200 hover:bg-gray-50 shadow-sm flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
              }}
              type="button"
              title="Add child node"
            >
              <Plus size={14} className="text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {showRoleDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowRoleDropdown(false)}
        />
      )}
    </div>
  );
}
