"use client";

import { InfoIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function TaskColorLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-gray-600 dark:text-gray-300"
          aria-label="Open task category color guide"
        >
          <InfoIcon className="w-4 h-4" />
          Color Guide
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              Task Color Guide
            </h4>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tasks are color-coded by their link type for easy identification
          </p>

          <div className="space-y-2">
            {/* KPI Tasks */}
            <div className="flex items-center gap-3 p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  KPI Tasks
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Linked to Key Performance Indicators
                </div>
              </div>
            </div>

            {/* Initiative Tasks */}
            <div className="flex items-center gap-3 p-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium text-green-900 dark:text-green-100">
                  Initiative Tasks
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Linked to Strategic Initiatives
                </div>
              </div>
            </div>

            {/* Self-Development Tasks */}
            <div className="flex items-center gap-3 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Self-Development
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  Fulfilled or unmet personal development activities
                </div>
              </div>
            </div>

            {/* Unlinked Tasks */}
            <div className="flex items-center gap-3 p-2 rounded-md bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
              <div className="w-3 h-3 rounded-full bg-gray-500 flex-shrink-0" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Unlinked Tasks
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  General tasks not linked to KPIs/Initiatives
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
