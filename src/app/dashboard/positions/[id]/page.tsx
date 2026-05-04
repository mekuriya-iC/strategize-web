"use client";

import { use } from "react";
import { usePosition, useCompetencyPositionAssignments } from "@/hooks/positions/usePositions";
import { CompetencyAssignmentList } from "@/components/positions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, Calendar, Tag } from "lucide-react";
import { useRouter } from "next/navigation";

interface PositionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PositionDetailPage({ params }: PositionDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { position, loading: posLoading } = usePosition(id);
  const { assignments, loading: assignLoading } = useCompetencyPositionAssignments({
    positionId: id,
  });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  if (posLoading) {
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

  if (!position) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Position not found
        </h2>
        <p className="text-gray-500 mb-4">
          The position you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard/positions")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Positions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/positions")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Positions
      </Button>

      {/* Position Header */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {position.title}
            </h1>
            {position.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {position.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              {position.grade && (
                <div className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  <span>Grade: <strong>{position.grade}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(position.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competency Assignments */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <CompetencyAssignmentList
          assignments={assignments}
          positionId={id}
          loading={assignLoading}
        />
      </div>
    </div>
  );
}
