"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useEvaluationCycles } from "@/hooks/evaluations/useEvaluationCycles";
import { EvaluationCycleStatus } from "@/types/evaluation";
import { TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useApolloClient } from "@apollo/client";
import {
  GET_COMPETENCY_ASSESSMENTS,
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

interface CoreCompetencyScore {
  coreCompetencyId: string;
  name: string;
  score: number; // out of 5
  weightedScore: number; // actual percentage contribution
  evaluatorScores: {
    self: number;
    supervisor: number;
    subordinate: number;
    peer: number;
  };
}

export default function Employee360Results() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canReadAll = can("evaluations:read_all");

  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(
    user?.employeeId || ""
  );

  // Enforce: Regular employees can only view their own results
  useEffect(() => {
    if (!canReadAll && targetEmployeeId !== user?.employeeId) {
      setTargetEmployeeId(user?.employeeId || "");
    }
  }, [canReadAll, user?.employeeId, targetEmployeeId]);

  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: !canReadAll,
  });

  const { cycles } = useEvaluationCycles(
    1,
    10,
    "",
    EvaluationCycleStatus.ACTIVE
  );
  const activeCycle = cycles?.[0];
  const totalEvaluationWeight = activeCycle?.totalEvaluationWeight || 25;

  // Fetch assessments for the target employee
  const { data: assessmentsData, loading: assessmentsLoading } = useQuery(
    GET_COMPETENCY_ASSESSMENTS,
    {
      variables: {
        page: 1,
        limit: 100,
        evaluationCycleId: activeCycle?.evaluationCycleId,
        evaluateeUserId: targetEmployeeId,
      },
      skip: !activeCycle?.evaluationCycleId || !targetEmployeeId,
      fetchPolicy: "network-only",
    }
  );

  const assessments = assessmentsData?.competencyAssessments?.items || [];
  
  // Only include SUBMITTED assessments
  const submittedAssessments = assessments.filter(
    (a: any) => a.status === "SUBMITTED"
  );

  const [coreCompetencyScores, setCoreCompetencyScores] = useState<
    CoreCompetencyScore[]
  >([]);
  const [overallScore, setOverallScore] = useState(0);
  const [weighted360Score, setWeighted360Score] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>({
    self: 0,
    supervisor: 0,
    subordinate: 0,
    peer: 0,
  });

  useEffect(() => {
    if (submittedAssessments.length > 0) {
      calculateScores();
    } else {
      setCoreCompetencyScores([]);
      setOverallScore(0);
      setWeighted360Score(0);
      setWeights({ self: 0, supervisor: 0, subordinate: 0, peer: 0 });
    }
  }, [submittedAssessments.length, targetEmployeeId]);

  const client = useApolloClient();

  const calculateScores = async () => {
    setCalculating(true);

    try {
      console.log('[360 Results] Starting calculation with assessments:', submittedAssessments.length);
      console.log('[360 Results] Assessment details:', submittedAssessments.map(a => ({
        id: a.competencyAssessmentId,
        type: a.relationType,
        weight: a.weightPercent,
        status: a.status
      })));

      // Step 1: Fetch all responses for all submitted assessments
      const allResponses: any[] = [];
      const weightsByType: Record<string, number> = {
        self: 0,
        supervisor: 0,
        subordinate: 0,
        peer: 0,
      };

      for (const assessment of submittedAssessments) {
        const { data } = await client.query({
          query: GET_ASSESSMENT_RESPONSES,
          variables: { 
            assessmentId: assessment.competencyAssessmentId,
            page: 1,
            limit: 1000
          },
          fetchPolicy: 'network-only',
        });

        const responses = data?.assessmentResponses?.items || [];
        const relationType = assessment.relationType.toLowerCase();

        console.log(`[360 Results] Fetched ${responses.length} responses for ${relationType} (weight: ${assessment.weightPercent}%)`);

        allResponses.push({
          relationType,
          weight: assessment.weightPercent || 0,
          responses,
        });

        // Track weights
        weightsByType[relationType] = assessment.weightPercent || 0;
      }

      console.log('[360 Results] Weights by type:', weightsByType);
      console.log('[360 Results] Total responses fetched:', allResponses.reduce((sum, r) => sum + r.responses.length, 0));

      setWeights(weightsByType);

      // Step 2: Group by Core Competency -> Competency -> Indicators
      const coreCompData: Record<
        string,
        {
          name: string;
          competencies: Record<
            string,
            {
              name: string;
              indicators: Record<string, number[]>;
            }
          >;
        }
      > = {};

      allResponses.forEach(({ relationType, responses }) => {
        responses.forEach((response: any) => {
          const comp = response.indicator?.competency;
          const coreComp = comp?.coreCompetency;

          if (!comp || !coreComp) {
            console.warn('[360 Results] Skipping response - missing competency or coreCompetency:', response);
            return;
          }

          const coreId = coreComp.coreCompetencyId;
          const compId = comp.competencyId;

          // Initialize structures
          if (!coreCompData[coreId]) {
            coreCompData[coreId] = {
              name: coreComp.name,
              competencies: {},
            };
          }

          if (!coreCompData[coreId].competencies[compId]) {
            coreCompData[coreId].competencies[compId] = {
              name: comp.name,
              indicators: { self: [], supervisor: [], subordinate: [], peer: [] },
            };
          }

          // Add rating
          coreCompData[coreId].competencies[compId].indicators[
            relationType
          ].push(response.rating);
        });
      });

      console.log('[360 Results] Grouped data by core competency:', Object.entries(coreCompData).map(([id, data]) => ({
        id,
        name: data.name,
        competencies: Object.keys(data.competencies).length
      })));

      // Step 3: Calculate scores
      const average = (arr: number[]) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const scores: CoreCompetencyScore[] = Object.entries(coreCompData).map(
        ([coreId, coreData]) => {
          // Calculate competency scores (average of indicators)
          const compScores = Object.values(coreData.competencies).map((comp) => ({
            self: average(comp.indicators.self),
            supervisor: average(comp.indicators.supervisor),
            subordinate: average(comp.indicators.subordinate),
            peer: average(comp.indicators.peer),
          }));

          // Calculate core competency scores (average of competencies)
          const evaluatorScores = {
            self: average(compScores.map((c) => c.self)),
            supervisor: average(compScores.map((c) => c.supervisor)),
            subordinate: average(compScores.map((c) => c.subordinate)),
            peer: average(compScores.map((c) => c.peer)),
          };

          // Calculate weighted score (actual percentage contribution)
          const weightedScore =
            (evaluatorScores.self / 5) * weightsByType.self +
            (evaluatorScores.supervisor / 5) * weightsByType.supervisor +
            (evaluatorScores.subordinate / 5) * weightsByType.subordinate +
            (evaluatorScores.peer / 5) * weightsByType.peer;

          // Calculate overall score out of 5 (for display)
          let totalWeight = 0;
          let weightedSum = 0;

          if (evaluatorScores.self > 0) {
            weightedSum += evaluatorScores.self * weightsByType.self;
            totalWeight += weightsByType.self;
          }
          if (evaluatorScores.supervisor > 0) {
            weightedSum += evaluatorScores.supervisor * weightsByType.supervisor;
            totalWeight += weightsByType.supervisor;
          }
          if (evaluatorScores.subordinate > 0) {
            weightedSum += evaluatorScores.subordinate * weightsByType.subordinate;
            totalWeight += weightsByType.subordinate;
          }
          if (evaluatorScores.peer > 0) {
            weightedSum += evaluatorScores.peer * weightsByType.peer;
            totalWeight += weightsByType.peer;
          }

          const score = totalWeight > 0 ? weightedSum / totalWeight : 0;

          return {
            coreCompetencyId: coreId,
            name: coreData.name,
            score,
            weightedScore,
            evaluatorScores,
          };
        }
      );

      setCoreCompetencyScores(scores);

      console.log('[360 Results] Calculated scores:', scores.map(s => ({
        name: s.name,
        score: s.score,
        weightedScore: s.weightedScore,
        evaluatorScores: s.evaluatorScores
      })));

      // Overall score (out of 5)
      const overall = average(scores.map((s) => s.score));
      setOverallScore(overall);

      // Weighted 360 score (actual percentage)
      const weighted360 = average(scores.map((s) => s.weightedScore));
      setWeighted360Score(weighted360);

      console.log('[360 Results] Final results:', {
        overallScore: overall,
        weighted360Score: weighted360,
        weights: weightsByType
      });
    } catch (error) {
      console.error("[360 Results] Error calculating scores:", error);
    } finally {
      setCalculating(false);
    }
  };

  if (assessmentsLoading || calculating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const hasResults = submittedAssessments.length > 0;

  return (
    <div className="space-y-6">
      {/* Employee Selector for Admins/HR */}
      {canReadAll && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="font-medium text-gray-900">View Results For:</h3>
              </div>
              <Select
                value={targetEmployeeId}
                onValueChange={setTargetEmployeeId}
              >
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeesData?.employees?.items.map((emp: any) => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} ({emp.title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

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
                Results will be available after evaluations are completed and
                submitted.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Score Card */}
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
                {overallScore >= 4.5
                  ? "Exceeds Expectations"
                  : overallScore >= 3.5
                    ? "Meets Expectations"
                    : overallScore >= 2.5
                      ? "Needs Improvement"
                      : "Below Expectations"}
              </p>
            </div>
          </div>

          {/* Weighted 360 Score Card */}
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
                      out of {totalEvaluationWeight}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Your weighted 360 evaluation contribution to overall
                    performance
                  </p>
                </div>

                {/* Individual evaluator breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {Object.entries(weights).map(([type, weight]) => {
                    if (weight === 0) return null;

                    const avgScore =
                      coreCompetencyScores.length > 0
                        ? coreCompetencyScores.reduce(
                            (sum, c) => sum + c.evaluatorScores[type as keyof typeof c.evaluatorScores],
                            0
                          ) / coreCompetencyScores.length
                        : 0;

                    const contribution = (avgScore / 5) * weight;

                    return (
                      <div
                        key={type}
                        className="bg-white rounded-lg p-3 border border-green-100 shadow-sm"
                      >
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                          {type}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {contribution.toFixed(2)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {avgScore.toFixed(1)}/5 × {weight}%
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress towards maximum</span>
                    <span>
                      {((weighted360Score / totalEvaluationWeight) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-teal-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (weighted360Score / totalEvaluationWeight) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Competency Scores Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreCompetencyScores.map((coreComp, idx) => {
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
              ];
              const style = colors[idx % colors.length];

              return (
                <Card
                  key={coreComp.coreCompetencyId}
                  className={`border-2 ${style.borderColor}`}
                >
                  <CardContent className="pt-6">
                    <div
                      className={`w-12 h-12 rounded-lg ${style.bgColor} flex items-center justify-center mb-3`}
                    >
                      <span className={`text-2xl font-bold ${style.color}`}>
                        {coreComp.score.toFixed(1)}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2">
                      {coreComp.name}
                    </h3>
                    <div className="text-xs text-gray-500 space-y-1">
                      {Object.entries(coreComp.evaluatorScores).map(
                        ([type, score]) =>
                          score > 0 && (
                            <div key={type} className="flex justify-between">
                              <span className="capitalize">{type}:</span>
                              <span className="font-medium">
                                {score.toFixed(1)}
                              </span>
                            </div>
                          )
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Applied Weights Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applied Weights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(weights).map(([type, weight]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="capitalize text-gray-700">{type}:</span>
                    <span className="font-semibold text-indigo-600">
                      {weight}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
