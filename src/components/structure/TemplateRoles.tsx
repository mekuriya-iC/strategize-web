"use client";

import { Crown, UserCog, Users, Briefcase, User, Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNodeTypes } from "@/hooks/orgChart/useNodeTypes";
import { toast } from "sonner";

// Built-in role display (not from API — these are EmployeeRole enum values, not NodeTypes)
const BUILT_IN_ROLES = [
  { id: "ceo",         name: "CEO",         icon: <Crown size={16} />,   color: "#5B5BF7" },
  { id: "director",    name: "Director",    icon: <UserCog size={16} />, color: "#8B5CF6" },
  { id: "manager",     name: "Manager",     icon: <Briefcase size={16} />, color: "#EC4899" },
  { id: "team-leader", name: "Team Leader", icon: <Users size={16} />,   color: "#F43F5E" },
  { id: "employee",    name: "Employee",    icon: <User size={16} />,    color: "#EF4444" },
];

const CUSTOM_COLORS = ["#22C55E", "#F59E0B", "#06B6D4", "#A855F7", "#F97316"];

interface TemplateRolesProps {
  canManage: boolean;
}

// Custom roles are stored as NodeTypes with icon = "role"
export default function TemplateRoles({ canManage }: TemplateRolesProps) {
  const { nodeTypes, creating, removing, createNodeType, removeNodeType } = useNodeTypes();
  const customRoles = nodeTypes.filter((n) => !n.isBuiltIn && n.icon === "role");

  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleAdd = async () => {
    const name = inputValue.trim();
    if (!name) return;
    const color = CUSTOM_COLORS[customRoles.length % CUSTOM_COLORS.length];
    await createNodeType(name, color, "role");
    toast.success(`"${name}" role saved`);
    setInputValue("");
    setShowInput(false);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Template Roles
      </h3>

      <div className="space-y-2">
        {/* Built-in roles (display only) */}
        {BUILT_IN_ROLES.map((role) => (
          <div
            key={role.id}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ backgroundColor: `${role.color}1A` }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded" style={{ color: role.color }}>
              {role.icon}
            </div>
            <span className="text-sm font-medium" style={{ color: role.color }}>
              {role.name}
            </span>
          </div>
        ))}

        {/* Custom roles from API */}
        {customRoles.map((role) => (
          <div
            key={role.nodeTypeId}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg group"
            style={{ backgroundColor: `${role.color}1A` }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded" style={{ color: role.color ?? undefined }}>
              <User size={16} />
            </div>
            <span className="flex-1 text-sm font-medium" style={{ color: role.color ?? undefined }}>
              {role.name}
            </span>
            {canManage && (
              <button
                onClick={() => removeNodeType(role.nodeTypeId)}
                disabled={removing}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete"
              >
                <Trash2 size={12} className="text-red-400" />
              </button>
            )}
          </div>
        ))}

        {/* Inline add input */}
        {canManage && (showInput ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowInput(false); }}
              placeholder="Role name..."
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
        ))}
      </div>
    </div>
  );
}
