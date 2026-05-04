"use client";

import { use } from "react";
import { useInitiative, useActivities } from "@/hooks/initiatives/useInitiatives";
import { ActivityTable, InitiativeStatusBadge } from "@/components/initiatives";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface InitiativeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function InitiativeDetailPage({ params }: InitiativeDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { initiative, loading: initLoading } = useInitiative(id);
  const { activities, loading: actLoading } = useActivities({ initiativeId: id });

  const formatDate = (date?: string) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (initLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-32 bg-gray-100 rounded-xl mb-6" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Initiative not found
        </h2>
        <p className="text-gray-500 mb-4">
          The initiative you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard/initiatives")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Initiatives
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/initiatives")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Initiatives
      </Button>

      {/* Initiative Header */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {initiative.title}
              </h1>
              <InitiativeStatusBadge status={initiative.status} />
            </div>
            {initiative.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {initiative.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              {initiative.owner && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{initiative.owner.fullName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(initiative.startDate)} — {formatDate(initiative.dueDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Created {formatDate(initiative.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {initiative.completionPercentage}%
            </span>
          </div>
          <Progress value={initiative.completionPercentage} className="h-3" />
        </div>
      </div>

      {/* Activities */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <ActivityTable
          activities={activities}
          initiativeId={id}
          loading={actLoading}
        />
      </div>
    </div>
  );
}
