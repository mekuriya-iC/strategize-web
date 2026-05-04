"use client";

import { useQuery } from "@apollo/client";
import { GET_OBJECTIVE } from "@/lib/graphql/queries/objectives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, ExternalLink, Loader2, AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface LinkedObjectiveCardProps {
  objectiveId?: string;
}

export default function LinkedObjectiveCard({
  objectiveId,
}: LinkedObjectiveCardProps) {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_OBJECTIVE, {
    variables: { objectiveId },
    skip: !objectiveId,
  });

  const objective = data?.objective;

  // If no objectiveId provided
  if (!objectiveId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Linked Strategic Objective
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Objective Link Not Available
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                This initiative was created with a linked objective, but the backend doesn't currently expose this relationship in the API. The link is stored but cannot be displayed here.
              </p>
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto mt-2 text-blue-600 dark:text-blue-400"
                onClick={() => router.push("/dashboard/objectives")}
              >
                View All Objectives →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Linked Strategic Objective
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !objective) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Linked Strategic Objective
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              {error ? "Failed to load objective" : "Objective not found"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    NOT_SUBMITTED:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    PENDING:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    APPROVED:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    REJECTED:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    ACTIVE:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    COMPLETED:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    ON_HOLD:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    CANCELLED:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  const typeColors: Record<string, string> = {
    CORPORATE:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    DIVISION:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    DEPARTMENT:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    PERSONNEL:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Linked Strategic Objective
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Objective Title */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {objective.title}
          </h4>
          {objective.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {objective.description}
            </p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {objective.type && (
            <Badge
              variant="outline"
              className={typeColors[objective.type] || ""}
            >
              {objective.type}
            </Badge>
          )}
          {objective.status && (
            <Badge
              variant="outline"
              className={statusColors[objective.status] || ""}
            >
              {objective.status.replace("_", " ")}
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          {objective.strategicPeriod && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Period:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {objective.strategicPeriod.name}
              </span>
            </div>
          )}
          {objective.weight !== null && objective.weight !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Weight:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {objective.weight}%
              </span>
            </div>
          )}
          {objective.ownerUser && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Owner:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {objective.ownerUser.fullName}
              </span>
            </div>
          )}
        </div>

        {/* View Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            router.push(`/dashboard/objectives/${objective.objectiveId}`)
          }
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View Objective Details
        </Button>
      </CardContent>
    </Card>
  );
}
