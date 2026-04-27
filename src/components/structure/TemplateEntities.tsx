"use client";

import { Building2, Users, Grid3x3, Briefcase, User, Plus } from "lucide-react";
import { useState } from "react";

interface EntityTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const entityTemplates: EntityTemplate[] = [
  {
    id: "corporate",
    name: "Corporate",
    icon: <Building2 size={16} />,
    color: "#5B5BF7",
    bgColor: "rgba(91, 91, 247, 0.1)",
  },
  {
    id: "division",
    name: "Division",
    icon: <Grid3x3 size={16} />,
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  {
    id: "department",
    name: "Department",
    icon: <Briefcase size={16} />,
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.1)",
  },
  {
    id: "unit",
    name: "Unit",
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

export default function TemplateEntities() {
  const [customEntities, setCustomEntities] = useState<string[]>([]);

  const handleAddCustom = () => {
    const customName = prompt("Enter custom entity name:");
    if (customName && customName.trim()) {
      setCustomEntities([...customEntities, customName.trim()]);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Template Entities
      </h3>
      <div className="space-y-2">
        {entityTemplates.map((entity) => (
          <button
            key={entity.id}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800 group"
            style={{ backgroundColor: entity.bgColor }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded"
              style={{ color: entity.color }}
            >
              {entity.icon}
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: entity.color }}
            >
              {entity.name}
            </span>
          </button>
        ))}

        {/* Custom Entities */}
        {customEntities.map((entity, index) => (
          <button
            key={`custom-${index}`}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded"
              style={{ color: "#22C55E" }}
            >
              <Grid3x3 size={16} />
            </div>
            <span className="text-sm font-medium" style={{ color: "#22C55E" }}>
              {entity}
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
