"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Target, 
  BarChart3, 
  BookOpen, 
  FileText, 
  Users, 
  Settings,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
}

export function QuickActionsGrid() {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      label: "Create Objective",
      icon: <Target className="h-6 w-6" />,
      href: "/dashboard/objectives/new",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30",
    },
    {
      label: "Assign KPI",
      icon: <BarChart3 className="h-6 w-6" />,
      href: "/dashboard/kpi-assignment",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30",
    },
    {
      label: "Submit Logbook",
      icon: <BookOpen className="h-6 w-6" />,
      href: "/dashboard/logbook",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30",
    },
    {
      label: "View Reports",
      icon: <FileText className="h-6 w-6" />,
      href: "/dashboard/reports",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30",
    },
    {
      label: "Manage Team",
      icon: <Users className="h-6 w-6" />,
      href: "/dashboard/employees",
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/30",
    },
    {
      label: "Performance",
      icon: <TrendingUp className="h-6 w-6" />,
      href: "/dashboard/performance",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30",
    },
    {
      label: "New Task",
      icon: <Plus className="h-6 w-6" />,
      href: "/dashboard/tasks/new",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/30",
    },
    {
      label: "Settings",
      icon: <Settings className="h-6 w-6" />,
      href: "/dashboard/settings",
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-900/30",
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.href)}
              className={`p-4 rounded-lg border ${action.bgColor} hover:shadow-md transition-all group`}
            >
              <div className={`${action.color} mb-2 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {action.label}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
