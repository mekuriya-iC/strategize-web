"use client";

import { Building2, Users, Grid3x3, Briefcase, User, Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNodeTypes } from "@/hooks/orgChart/useNodeTypes";
import { toast } from "sonner";

// Icon map for built-in types
const ICON_MAP: Record<string, React.ReactNode> = {
  "building-2": <Building2 size={16} />,
  layers:       <Grid3x3 size={16} />,
  briefcase:    <Briefcase size={16} />,
  users:        <Users size={16} />,
  user:         <User size={16} />,
};

const CUSTOM_COLORS = [
  "#22C55E", "#F59E0B", "#06B6D4", "#A855F7", "#F97316",
];

export default function TemplateEntities() {
  const { builtIn, custom, loading, creating, removing, createNodeType, removeNodeType } = useNodeTypes();
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleAdd = async () => {
    const name = inputValue.trim();
    if (!name) return;
    const color = CUSTOM_COLORS[custom.length % CUSTOM_COLORS.length];
    await createNodeType(name, color, "grid-3x3");
    toast.success(`"${name}" entity type saved`);
    setInputValue("");
    setShowInput(false);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Template Entities
      </h3>

      <div className="space-y-2">
        {/* Built-in types from API */}
        {loading && builtIn.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
            <Loader2 size={12} className="animate-spin" /> Loading...
          </div>
        ) : (
          builtIn.map((entity) => (
            <div
              key={entity.nodeTypeId}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ backgroundColor: `${entity.color}1A` }}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded" style={{ color: entity.color ?? undefined }}>
                {ICON_MAP[entity.icon ?? ""] ?? <Grid3x3 size={16} />}
              </div>
              <span className="text-sm font-medium" style={{ color: entity.color ?? undefined }}>
                {entity.name}
              </span>
            </div>
          ))
        )}

        {/* Custom types */}
        {custom.map((entity) => (
          <div
            key={entity.nodeTypeId}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg group"
            style={{ backgroundColor: `${entity.color}1A` }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded" style={{ color: entity.color ?? undefined }}>
              <Grid3x3 size={16} />
            </div>
            <span className="flex-1 text-sm font-medium" style={{ color: entity.color ?? undefined }}>
              {entity.name}
            </span>
            <button
              onClick={() => removeNodeType(entity.nodeTypeId)}
              disabled={removing}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete"
            >
              <Trash2 size={12} className="text-red-400" />
            </button>
          </div>
        ))}

        {/* Inline add input */}
        {showInput ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowInput(false); }}
              placeholder="Entity name..."
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#18181b] outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleAdd}
              disabled={creating || !inputValue.trim()}
              className="px-3 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : "Add"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100 dark:bg-gray-800">
              <Plus size={16} className="text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom</span>
          </button>
        )}
      </div>
    </div>
  );
}
