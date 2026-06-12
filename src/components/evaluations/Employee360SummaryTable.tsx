"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useEvaluationCycles } from "@/hooks/evaluations/useEvaluationCycles";
import { EvaluationCycleStatus } from "@/types/evaluation";
import { useState, useEffect } from "react";
import { useQuery, useApolloClient } from "@apollo/client";
import {
  GET_COMPETENCY_ASSESSMENTS,
  GET_ASSESSMENT_RESPONSES,
} from "@/lib/graphql/queries/evaluations";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EmployeeSummary {
  employeeId: string;
  fullName: string;
  title: string;
  organizationalUnit: string; // Department name or Division name
  selfScore: number;
  selfWeight: number;
  selfWeighted: number;
  peerScore: number;
  peerWeight: number;
  peerWeighted: number;
  supervisorScore: number;
  supervisorWeight: number;
  supervisorWeighted: number;
  subordinateScore: number;
  subordinateWeight: number;
  subordinateWeighted: number;
  total360Score: number;
  completedAssessments: number;
  totalAssessments: number;
}

export default function Employee360SummaryTable() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canReadAll = can("evaluations:read_all");
  const client = useApolloClient();

  const { cycles } = useEvaluationCycles(
    1,
    10,
    "",
    EvaluationCycleStatus.ACTIVE
  );
  const activeCycle = cycles?.[0];
  const totalEvaluationWeight = activeCycle?.totalEvaluationWeight || 25;

  const { data: employeesData, loading: employeesLoading } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: !canReadAll || !activeCycle?.evaluationCycleId,
  });

  const [summaries, setSummaries] = useState<EmployeeSummary[]>([]);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (activeCycle?.evaluationCycleId && employeesData?.employees?.items) {
      calculateAllSummaries();
    }
  }, [activeCycle?.evaluationCycleId, employeesData?.employees?.items]);

  const calculateAllSummaries = async () => {
    if (!employeesData?.employees?.items) return;
    
    setCalculating(true);
    const employees = employeesData.employees.items;
    const results: EmployeeSummary[] = [];

    try {
      for (const employee of employees) {
        const summary = await calculateEmployeeSummary(employee);
        results.push(summary);
      }

      // Sort by total360Score descending
      results.sort((a, b) => b.total360Score - a.total360Score);
      setSummaries(results);
    } catch (error) {
      console.error("[360 Summary] Error calculating summaries:", error);
    } finally {
      setCalculating(false);
    }
  };

  const calculateEmployeeSummary = async (employee: any): Promise<EmployeeSummary> => {
    // Use the computed organizationalUnit field from the backend
    const organizationalUnit = employee.organizationalUnit || "N/A";

    try {
      // Fetch all assessments for this employee
      const { data: assessmentsData } = await client.query({
        query: GET_COMPETENCY_ASSESSMENTS,
        variables: {
          page: 1,
          limit: 100,
          evaluationCycleId: activeCycle?.evaluationCycleId,
          evaluateeUserId: employee.employeeId,
        },
        fetchPolicy: "network-only",
      });

      const assessments = assessmentsData?.competencyAssessments?.items || [];
      const submittedAssessments = assessments.filter(
        (a: any) => a.status === "SUBMITTED"
      );

      // Initialize scores and weights
      const scores: Record<string, { ratings: number[]; weight: number }> = {
        self: { ratings: [], weight: 0 },
        peer: { ratings: [], weight: 0 },
        supervisor: { ratings: [], weight: 0 },
        subordinate: { ratings: [], weight: 0 },
      };

      // Fetch responses for each assessment
      for (const assessment of submittedAssessments) {
        const { data } = await client.query({
          query: GET_ASSESSMENT_RESPONSES,
          variables: {
            assessmentId: assessment.competencyAssessmentId,
            page: 1,
            limit: 1000,
          },
          fetchPolicy: "network-only",
        });

        const responses = data?.assessmentResponses?.items || [];
        const relationType = assessment.relationType.toLowerCase();

        // Store weight
        scores[relationType].weight = assessment.weightPercent || 0;

        // Collect all ratings
        responses.forEach((response: any) => {
          if (response.rating) {
            scores[relationType].ratings.push(response.rating);
          }
        });
      }

      // Calculate average scores and weighted contributions
      const average = (arr: number[]) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const selfScore = average(scores.self.ratings);
      const peerScore = average(scores.peer.ratings);
      const supervisorScore = average(scores.supervisor.ratings);
      const subordinateScore = average(scores.subordinate.ratings);

      const selfWeighted = (selfScore / 5) * scores.self.weight;
      const peerWeighted = (peerScore / 5) * scores.peer.weight;
      const supervisorWeighted = (supervisorScore / 5) * scores.supervisor.weight;
      const subordinateWeighted = (subordinateScore / 5) * scores.subordinate.weight;

      const total360Score = selfWeighted + peerWeighted + supervisorWeighted + subordinateWeighted;

      return {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        title: employee.title || "N/A",
        organizationalUnit,
        selfScore,
        selfWeight: scores.self.weight,
        selfWeighted,
        peerScore,
        peerWeight: scores.peer.weight,
        peerWeighted,
        supervisorScore,
        supervisorWeight: scores.supervisor.weight,
        supervisorWeighted,
        subordinateScore,
        subordinateWeight: scores.subordinate.weight,
        subordinateWeighted,
        total360Score,
        completedAssessments: submittedAssessments.length,
        totalAssessments: assessments.length,
      };
    } catch (error) {
      console.error(`[360 Summary] Error calculating for ${employee.fullName}:`, error);
      return {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        title: employee.title || "N/A",
        organizationalUnit,
        selfScore: 0,
        selfWeight: 0,
        selfWeighted: 0,
        peerScore: 0,
        peerWeight: 0,
        peerWeighted: 0,
        supervisorScore: 0,
        supervisorWeight: 0,
        supervisorWeighted: 0,
        subordinateScore: 0,
        subordinateWeight: 0,
        subordinateWeighted: 0,
        total360Score: 0,
        completedAssessments: 0,
        totalAssessments: 0,
      };
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Employee Name",
      "Title",
      "Department/Division",
      "Self Score",
      "Self Weight %",
      "Self Weighted %",
      "Peer Score",
      "Peer Weight %",
      "Peer Weighted %",
      "Supervisor Score",
      "Supervisor Weight %",
      "Supervisor Weighted %",
      "Subordinate Score",
      "Subordinate Weight %",
      "Subordinate Weighted %",
      "Total 360 Score %",
      "Completed/Total Assessments",
    ];

    const rows = summaries.map((s) => [
      s.fullName,
      s.title,
      s.organizationalUnit,
      s.selfScore.toFixed(2),
      s.selfWeight.toFixed(2),
      s.selfWeighted.toFixed(2),
      s.peerScore.toFixed(2),
      s.peerWeight.toFixed(2),
      s.peerWeighted.toFixed(2),
      s.supervisorScore.toFixed(2),
      s.supervisorWeight.toFixed(2),
      s.supervisorWeighted.toFixed(2),
      s.subordinateScore.toFixed(2),
      s.subordinateWeight.toFixed(2),
      s.subordinateWeighted.toFixed(2),
      s.total360Score.toFixed(2),
      `${s.completedAssessments}/${s.totalAssessments}`,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `360-evaluation-summary-${activeCycle?.name || "report"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!canReadAll) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">
            You don't have permission to view the summary table.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (employeesLoading || calculating) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-600">
              {calculating
                ? "Calculating 360 scores for all employees..."
                : "Loading employees..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceColor = (score: number, maxWeight: number) => {
    const percentage = (score / maxWeight) * 100;
    if (percentage >= 90) return "text-green-600 font-semibold";
    if (percentage >= 75) return "text-blue-600 font-semibold";
    if (percentage >= 60) return "text-amber-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-indigo-600" />
              <div>
                <CardTitle className="text-xl">
                  360° Evaluation Summary - All Employees
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {activeCycle?.name || "No active cycle"}
                </p>
              </div>
            </div>
            <Button
              onClick={exportToCSV}
              disabled={summaries.length === 0}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Department/Division</TableHead>
                  <TableHead className="text-center font-semibold bg-blue-50">
                    Self
                    <br />
                    <span className="text-xs font-normal text-gray-500">
                      Score / Weight / Wtd
                    </span>
                  </TableHead>
                  <TableHead className="text-center font-semibold bg-purple-50">
                    Peer
                    <br />
                    <span className="text-xs font-normal text-gray-500">
                      Score / Weight / Wtd
                    </span>
                  </TableHead>
                  <TableHead className="text-center font-semibold bg-green-50">
                    Supervisor
                    <br />
                    <span className="text-xs font-normal text-gray-500">
                      Score / Weight / Wtd
                    </span>
                  </TableHead>
                  <TableHead className="text-center font-semibold bg-amber-50">
                    Subordinate
                    <br />
                    <span className="text-xs font-normal text-gray-500">
                      Score / Weight / Wtd
                    </span>
                  </TableHead>
                  <TableHead className="text-center font-semibold bg-indigo-50">
                    Total 360
                    <br />
                    <span className="text-xs font-normal text-gray-500">
                      out of {totalEvaluationWeight}%
                    </span>
                  </TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      No evaluation data available
                    </TableCell>
                  </TableRow>
                ) : (
                  summaries.map((summary) => (
                    <TableRow key={summary.employeeId} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{summary.fullName}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {summary.title}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {summary.organizationalUnit}
                      </TableCell>
                      
                      {/* Self */}
                      <TableCell className="text-center text-sm bg-blue-50/30">
                        {summary.selfWeight > 0 ? (
                          <div className="space-y-1">
                            <div className="text-gray-700">{summary.selfScore.toFixed(1)}/5</div>
                            <div className="text-xs text-gray-500">{summary.selfWeight}%</div>
                            <div className="font-semibold text-blue-600">
                              {summary.selfWeighted.toFixed(2)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      {/* Peer */}
                      <TableCell className="text-center text-sm bg-purple-50/30">
                        {summary.peerWeight > 0 ? (
                          <div className="space-y-1">
                            <div className="text-gray-700">{summary.peerScore.toFixed(1)}/5</div>
                            <div className="text-xs text-gray-500">{summary.peerWeight}%</div>
                            <div className="font-semibold text-purple-600">
                              {summary.peerWeighted.toFixed(2)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      {/* Supervisor */}
                      <TableCell className="text-center text-sm bg-green-50/30">
                        {summary.supervisorWeight > 0 ? (
                          <div className="space-y-1">
                            <div className="text-gray-700">
                              {summary.supervisorScore.toFixed(1)}/5
                            </div>
                            <div className="text-xs text-gray-500">
                              {summary.supervisorWeight}%
                            </div>
                            <div className="font-semibold text-green-600">
                              {summary.supervisorWeighted.toFixed(2)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      {/* Subordinate */}
                      <TableCell className="text-center text-sm bg-amber-50/30">
                        {summary.subordinateWeight > 0 ? (
                          <div className="space-y-1">
                            <div className="text-gray-700">
                              {summary.subordinateScore.toFixed(1)}/5
                            </div>
                            <div className="text-xs text-gray-500">
                              {summary.subordinateWeight}%
                            </div>
                            <div className="font-semibold text-amber-600">
                              {summary.subordinateWeighted.toFixed(2)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-center bg-indigo-50/30">
                        <div className="space-y-1">
                          <div
                            className={`text-xl ${getPerformanceColor(
                              summary.total360Score,
                              totalEvaluationWeight
                            )}`}
                          >
                            {summary.total360Score.toFixed(2)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {((summary.total360Score / totalEvaluationWeight) * 100).toFixed(0)}% of max
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {summary.completedAssessments === summary.totalAssessments &&
                        summary.totalAssessments > 0 ? (
                          <Badge variant="default" className="bg-green-500">
                            Complete
                          </Badge>
                        ) : summary.completedAssessments > 0 ? (
                          <Badge variant="secondary">
                            {summary.completedAssessments}/{summary.totalAssessments}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Not Started
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {summaries.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                Total Employees: <span className="font-semibold">{summaries.length}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>≥90% (Exceeds)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>≥75% (Meets)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span>≥60% (Needs Improvement)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>&lt;60% (Below)</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
