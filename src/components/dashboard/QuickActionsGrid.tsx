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
}

export function QuickActionsGrid() {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      label: "Create Objective",
      icon: <Target className="h-5 w-5" />,
      href: "/dashboard/objectives/new",
    },
    {
      label: "Assign KPI",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/dashboard/kpi-assignment",
    },
    {
      label: "Submit Logbook",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/dashboard/logbook",
    },
    {
      label: "View Reports",
      icon: <FileText className="h-5 w-5" />,
      href: "/dashboard/reports",
    },
    {
      label: "Manage Team",
      icon: <Users className="h-5 w-5" />,
      href: "/dashboard/employees",
    },
    {
      label: "Performance",
      icon: <TrendingUp className="h-5 w-5" />,
      href: "/dashboard/performance",
    },
    {
      label: "New Task",
      icon: <Plus className="h-5 w-5" />,
      href: "/dashboard/tasks/new",
    },
    {
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/dashboard/settings",
    },
  ];

  return (
    <Card className="border border-slate-200 dark:border-slate-800">
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.href)}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col items-start text-left group"
            >
              <div className="text-slate-500 dark:text-slate-400 mb-2 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                {action.icon}
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                {action.label}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
