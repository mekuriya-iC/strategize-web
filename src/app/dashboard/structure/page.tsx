"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StructureBuilder from "@/components/structure/StructureBuilder";
import TemplateEntities from "@/components/structure/TemplateEntities";
import TemplateRoles from "@/components/structure/TemplateRoles";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StructurePage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("classic-top-down");

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Left Sidebar - Templates */}
      <div className="w-72 flex-shrink-0 bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Template Entities */}
          <TemplateEntities />
          
          {/* Template Roles */}
          <TemplateRoles />
        </div>
      </div>

      {/* Main Content - Structure Builder */}
      <div className="flex-1 bg-white dark:bg-[#18181b] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-600 dark:text-gray-400"
              >
                <path
                  d="M2 4.5C2 3.67157 2.67157 3 3.5 3H12.5C13.3284 3 14 3.67157 14 4.5V11.5C14 12.3284 13.3284 13 12.5 13H3.5C2.67157 13 2 12.3284 2 11.5V4.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 6H11M5 9H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Structure
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Classic Top-down Template
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span className="text-sm">🇬🇧 Eng</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>🇬🇧 English</DropdownMenuItem>
              <DropdownMenuItem>🇫🇷 French</DropdownMenuItem>
              <DropdownMenuItem>🇪🇸 Spanish</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Structure Builder */}
        <StructureBuilder templateId={selectedTemplate} />
      </div>
    </div>
  );
}
