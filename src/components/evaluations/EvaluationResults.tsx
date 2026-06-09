"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useCompetencyAssessments } from "@/hooks/evaluations/useCompetencyAssessment";
import { useEvaluationCycles } from "@/hooks/evaluations/useEvaluationCycles";
import { useEvaluationWeightConfigs } from "@/hooks/evaluations/useEvaluationWeights";
import { EvaluationCycleStatus, EvaluationStatus } from "@/types/evaluation";
import { TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import {
  GET_ASSESSMENT_RESPONSES,
} from "@/lib/graphql/queries/evaluations";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Employee360Results from "./Employee360Results";
import Employee360SummaryTable from "./Employee360SummaryTable";

export default function EvaluationResults() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const client = useApolloClient();
  
  // Only HR/Super Admin can view other employees' results
  const canReadAll = can("evaluations:read_all");
  
  // Default view mode: "given" for regular employees, "received" for HR/Admin
  const [viewMode, setViewMode] = useState<"received" | "given" | "summary">(
    canReadAll ? "summary" : "given"
  );

  // Enforce: Regular employees cannot view "received" or "summary" mode
  useEffect(() => {
    if (!canReadAll && (viewMode === "received" || viewMode === "summary")) {
      setViewMode("given");
    }
  }, [canReadAll, viewMode]);

  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: !canReadAll,
  });

  const { cycles } = useEvaluationCycles(
    1,
    1,
    "",
    EvaluationCycleStatus.ACTIVE,
  );
  const activeCycle = cycles?.[0];
  
  // Get the cycle's totalEvaluationWeight (e.g., 30%)
  const cycleTotal360Weight = activeCycle?.totalEvaluationWeight || 25;

  const { assessments, loading } = useCompetencyAssessments(
    1,
    100,
    activeCycle?.evaluationCycleId,
    undefined, // evaluateeUserId not needed for "given" mode
    viewMode === "given" ? user?.employeeId : undefined,
  );

  const { weightConfigs } = useEvaluationWeightConfigs(
    activeCycle?.evaluationCycleId,
  );

  // Remove the defaultWeightsData query - not needed anymore for received mode
  // since Employee360Results handles its own data fetching

  const relationLabel = (rt: string) => {
    switch (rt) {
      case "self":
        return "Self";
      case "peer":
        return "Peer";
      case "supervisor":
        return "Supervisor";
      case "subordinate":
        return "Subordinate";
      default:
        return rt;
    }
  };

  // Filter assessments based on viewMode
  const filteredAssessments =
    assessments?.filter((a: any) => {
      if (viewMode === "given") {
        // Only show assessments where I am the evaluator and it's not a SELF assessment
        return (
          a.evaluator?.employeeId === user?.employeeId &&
          a.relationType.toLowerCase() !== "self"
        );
      }
      // For 'received', use the ones fetched by targetEmployeeId (evaluatee)
      return true;
    }) || [];

  // Calculate completed assessments
  const completedAssessments =
    filteredAssessments?.filter(
      (a: any) =>
        a.status === EvaluationStatus.COMPLETED ||
        a.status === EvaluationStatus.SUBMITTED,
    ) || [];

  const [calculatedScores, setCalculatedScores] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [selectedPeerAssessmentId, setSelectedPeerAssessmentId] = useState<
    string | null
  >(null);

  const hasResults =
    viewMode === "given"
      ? completedAssessments.length > 0 && !!selectedPeerAssessmentId
      : false; // Received mode handled by Employee360Results

  useEffect(() => {
    if (completedAssessments.length === 0 || !activeCycle) {
      setCalculatedScores([]);
      setOverallScore(0);
      return;
    }

    if (viewMode === "given") {
      if (selectedPeerAssessmentId) {
        calculateSingleAssessmentScores(selectedPeerAssessmentId);
      } else if (completedAssessments.length > 0) {
        // Default to first peer assessment if none selected
        setSelectedPeerAssessmentId(
          completedAssessments[0].competencyAssessmentId,
        );
      }
    }
  }, [
    completedAssessments.length,
    activeCycle?.evaluationCycleId,
    viewMode,
    selectedPeerAssessmentId,
  ]);

  const calculateSingleAssessmentScores = async (assessmentId: string) => {
    setCalculating(true);
    try {
      const { data } = await client.query({
        query: GET_ASSESSMENT_RESPONSES,
        variables: { assessmentId, page: 1, limit: 1000 },
        fetchPolicy: "network-only",
      });

      const responses = data?.assessmentResponses?.items || [];
      const scoresByComp: Record<string, any> = {};

      responses.forEach((response: any) => {
        const competencyId = response.indicator?.competency?.competencyId;
        const competencyName = response.indicator?.competency?.name;
        if (!competencyId || !competencyName) return;

        if (!scoresByComp[competencyId]) {
          scoresByComp[competencyId] = { name: competencyName, ratings: [] };
        }
        scoresByComp[competencyId].ratings.push(response.rating);
      });

      const competencyScores = Object.entries(scoresByComp).map(
        ([id, data]: [string, any]) => {
          const avg =
            data.ratings.reduce((a: number, b: number) => a + b, 0) /
            data.ratings.length;
          return {
            competencyId: id,
            name: data.name,
            breakdown: {
              self: 0,
              peer: 0,
              supervisor: 0,
              subordinate: 0, // Not applicable for single view
              given: avg,
            },
            score: avg,
          };
        },
      );

      const overall =
        competencyScores.length > 0
          ? competencyScores.reduce((sum, c) => sum + c.score, 0) /
            competencyScores.length
          : 0;

      const colors = [
        {
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          borderColor: "border-indigo-200",
        },
        {
          color: "text-teal-600",
          bgColor: "bg-teal-50",
          borderColor: "border-teal-200",
        },
        {
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
        },
        {
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
        },
      ];

      setCalculatedScores(
        competencyScores.map((comp, idx) => ({
          ...comp,
          ...colors[idx % colors.length],
        })),
      );
      setOverallScore(overall);
    } catch (error) {
      console.error("Error calculating single scores:", error);
    } finally {
      setCalculating(false);
    }
  };

  // Competency scores are calculated from submitted assessment responses.
  const competencyScores = calculatedScores.length > 0 ? calculatedScores : [];

  if (loading || calculating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle - Hide admin views for regular employees */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-gray-100 rounded-lg border border-gray-200">
          {canReadAll && (
            <>
              <button
                onClick={() => setViewMode("summary")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === "summary"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All Employees Summary
              </button>
              <button
                onClick={() => setViewMode("received")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === "received"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Individual 360 Results
              </button>
            </>
          )}
          <button
            onClick={() => setViewMode("given")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === "given"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Evaluations I Performed
          </button>
        </div>
      </div>

      {/* Render different content based on view mode */}
      {viewMode === "summary" ? (
        <Employee360SummaryTable />
      ) : viewMode === "received" ? (
        <Employee360Results />
      ) : (
        // "Given" mode content stays the same
        <>
          {/* Peer Selector for 'given' mode */}
      {viewMode === "given" && completedAssessments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h3 className="font-medium text-gray-900">
                  Ratings I gave to:
                </h3>
              </div>
              <Select
                value={selectedPeerAssessmentId || ""}
                onValueChange={setSelectedPeerAssessmentId}
              >
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select a peer" />
                </SelectTrigger>
                <SelectContent>
                  {completedAssessments.map((a: any) => (
                    <SelectItem
                      key={a.competencyAssessmentId}
                      value={a.competencyAssessmentId}
                    >
                      {a.evaluatee.fullName} ({a.evaluatee.title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Score Section */}
      {!hasResults ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Results Yet
              </h3>
              <p className="text-gray-500">
                {viewMode === "received"
                  ? targetEmployeeId === user?.employeeId
                    ? "Results will be available after you complete your evaluations and they are reviewed."
                    : "No completed evaluations found for this employee."
                  : "You haven't completed any peer evaluations in this cycle yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 md:p-8 border border-indigo-100">
            <div className="text-center">
              <div className="inline-flex items-baseline gap-2 mb-2">
                <span className="text-6xl md:text-7xl font-bold text-indigo-600">
                  {overallScore.toFixed(2)}
                </span>
                <span className="text-2xl text-gray-600">out of 5.0</span>
              </div>
              <p
                className={`font-medium text-lg ${
                  overallScore >= 4.5
                    ? "text-green-600"
                    : overallScore >= 3.5
                      ? "text-blue-600"
                      : overallScore >= 2.5
                        ? "text-amber-600"
                        : "text-red-600"
                }`}
              >
                {viewMode === "received"
                  ? overallScore >= 4.5
                    ? "Exceeds Expectations"
                    : overallScore >= 3.5
                      ? "Meets Expectations"
                      : overallScore >= 2.5
                        ? "Needs Improvement"
                        : "Below Expectations"
                  : selectedPeerAssessmentId
                    ? `Overall Rating given to ${
                        completedAssessments.find(
                          (a: any) =>
                            a.competencyAssessmentId ===
                            selectedPeerAssessmentId,
                        )?.evaluatee.fullName || "selected employee"
                      }`
                    : "Select an evaluation to view ratings"}
              </p>
              {viewMode === "received" && completedAssessments.length < 4 && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-100">
                  Note: This is a partial score based on{" "}
                  {completedAssessments.length} completed evaluation
                  {completedAssessments.length !== 1 ? "s" : ""}.
                </p>
              )}
            </div>
          </div>

          {/* Weighted 360 Score Card - Only for received mode */}
          {viewMode === "received" && total360Weight > 0 && (
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-teal-50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  360° Evaluation Weighted Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-green-600">
                        {weighted360Score.toFixed(2)}%
                      </span>
                      <span className="text-2xl text-gray-600">
                        out of {total360Weight.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Your weighted 360 evaluation contribution to overall performance
                    </p>
                  </div>

                  {/* Individual evaluator breakdown */}
                  {effectiveWeights && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {columns.map((col) => {
                        const weight = effectiveWeights[col] || 0;
                        if (weight === 0) return null;
                        
                        // Calculate average score for this relation type across all competencies
                        const avgScore = competencyScores.length > 0
                          ? competencyScores.reduce((sum, c) => sum + (c.breakdown[col] || 0), 0) / competencyScores.length
                          : 0;
                        
                        // Convert from 0-5 scale to percentage, then multiply by weight
                        const weightedContribution = (avgScore / 5) * weight;

                        return (
                          <div
                            key={col}
                            className="bg-white rounded-lg p-3 border border-green-100 shadow-sm"
                          >
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                              {relationLabel(col)}
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              {weightedContribution.toFixed(2)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {avgScore.toFixed(1)}/5 × {weight}%
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress towards maximum</span>
                      <span>{((weighted360Score / total360Weight) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((weighted360Score / total360Weight) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Core Competency Scores Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {competencyScores.map((coreCompetency) => (
              <Card
                key={coreCompetency.name}
                className={`border-2 ${coreCompetency.borderColor}`}
              >
                <CardContent className="pt-6">
                  <div
                    className={`w-12 h-12 rounded-lg ${coreCompetency.bgColor} flex items-center justify-center mb-3`}
                  >
                    <span className={`text-2xl font-bold ${coreCompetency.color}`}>
                      {coreCompetency.score.toFixed(1)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm leading-tight">
                    {coreCompetency.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Radar Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg
                      className="w-64 h-64 mx-auto"
                      viewBox="0 0 200 200"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Radar grid */}
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        fill="none"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="60"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        fill="none"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="40"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        fill="none"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="20"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        fill="none"
                      />

                      {/* Axes */}
                      <line
                        x1="100"
                        y1="100"
                        x2="100"
                        y2="20"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                      <line
                        x1="100"
                        y1="100"
                        x2="180"
                        y2="100"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                      <line
                        x1="100"
                        y1="100"
                        x2="100"
                        y2="180"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                      <line
                        x1="100"
                        y1="100"
                        x2="20"
                        y2="100"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />

                      {/* Data polygon - Self */}
                      <polygon
                        points="100,36 164,100 100,152 44,100"
                        fill="#6366F1"
                        fillOpacity="0.1"
                        stroke="#6366F1"
                        strokeWidth="2"
                      />

                      {/* Data polygon - Avg */}
                      <polygon
                        points="100,28 172,100 100,160 36,100"
                        fill="#10B981"
                        fillOpacity="0.1"
                        stroke="#10B981"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                        <span className="text-xs text-gray-600">Self</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        <span className="text-xs text-gray-600">Avg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                        <span className="text-xs text-gray-600">Sup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                          Core Competency
                        </th>
                        {viewMode === "received" ? (
                          <>
                            {columns.map((col) => (
                              <th
                                key={col}
                                className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs"
                              >
                                {relationLabel(col)}
                              </th>
                            ))}
                          </>
                        ) : (
                          <th className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                            Rating I Gave
                          </th>
                        )}
                        <th className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                          {viewMode === "received" ? "Wtd." : "Score"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {competencyScores.map((coreCompetency) => (
                        <tr
                          key={coreCompetency.name}
                          className="border-b border-gray-100"
                        >
                          <td className="py-3 px-2">
                            <span className={`font-medium ${coreCompetency.color}`}>
                              {coreCompetency.name}
                            </span>
                          </td>
                          {viewMode === "received" ? (
                            <>
                              {columns.map((col) => {
                                const v = coreCompetency.breakdown[col];
                                return (
                                  <td
                                    key={`${coreCompetency.name}-${col}`}
                                    className="text-center py-3 px-2 text-gray-900"
                                  >
                                    {v > 0 ? v.toFixed(1) : "-"}
                                  </td>
                                );
                              })}
                            </>
                          ) : (
                            <td className="text-center py-3 px-2 text-gray-900 font-medium">
                              {coreCompetency.breakdown.given.toFixed(1)}
                            </td>
                          )}
                          <td className="text-center py-3 px-2">
                            <span
                              className={`font-semibold ${coreCompetency.color}`}
                            >
                              {coreCompetency.score.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {viewMode === "received" && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium mb-1 uppercase">
                        Applied Weights
                      </p>
                      <p className="text-xs text-gray-600">
                        {weightsSummaryText || "Weights unavailable"}
                      </p>
                    </div>
                  )}
                  {viewMode === "given" && (
                    <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <p className="text-xs text-indigo-700 font-medium">
                        These are the ratings you submitted for this peer during
                        the current evaluation cycle.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
        )}
      </>
      )}
    </div>
  );
}
