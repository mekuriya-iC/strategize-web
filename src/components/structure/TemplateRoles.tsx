"use client";

import { Crown, UserCog, Users, Briefcase, User, Plus } from "lucide-react";
import { useState } from "react";

interface RoleTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const roleTemplates: RoleTemplate[] = [
  {
    id: "ceo",
    name: "CEO",
    icon: <Crown size={16} />,
    color: "#5B5BF7",
    bgColor: "rgba(91, 91, 247, 0.1)",
  },
  {
    id: "director",
    name: "Director",
    icon: <UserCog size={16} />,
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  {
    id: "manager",
    name: "Manager",
    icon: <Briefcase size={16} />,
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.1)",
  },
  {
    id: "team-leader",
    name: "Team Leader",
    icon: <Users size={16} />,
    color: "#F43F5E",
    bgColor: "rgba(244, 63, 94, 0.1)",
  },
  {
    id: "employee",
    name: "Employee",
    icon: <User size={16} />,
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
];

export default function TemplateRoles() {
  const [customRoles, setCustomRoles] = useState<string[]>([]);

  const handleAddCustom = () => {
    const customName = prompt("Enter custom role name:");
    if (customName && customName.trim()) {
      setCustomRoles([...customRoles, customName.trim()]);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Template Roles
      </h3>
      <div className="space-y-2">
        {roleTemplates.map((role) => (
          <button
            key={role.id}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800 group"
            style={{ backgroundColor: role.bgColor }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded"
              style={{ color: role.color }}
            >
              {role.icon}
            </div>
            <span className="text-sm font-medium" style={{ color: role.color }}>
              {role.name}
            </span>
          </button>
        ))}

        {/* Custom Roles */}
        {customRoles.map((role, index) => (
          <button
            key={`custom-${index}`}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded"
              style={{ color: "#22C55E" }}
            >
              <User size={16} />
            </div>
            <span className="text-sm font-medium" style={{ color: "#22C55E" }}>
              {role}
            </span>
          </button>
        ))}

        {/* Add Custom Button */}
        <button
          onClick={handleAddCustom}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100 dark:bg-gray-800">
            <Plus size={16} className="text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Custom
          </span>
        </button>
      </div>
    </div>
  );
}
