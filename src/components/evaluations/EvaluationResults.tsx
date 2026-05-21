'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/auth/useAuth';
import { usePermissions } from '@/hooks/permissions/usePermissions';
import { useCompetencyAssessments } from '@/hooks/evaluations/useCompetencyAssessment';
import { useEvaluationCycles } from '@/hooks/evaluations/useEvaluationCycles';
import { useEvaluationWeightConfigs } from '@/hooks/evaluations/useEvaluationWeights';
import { EvaluationCycleStatus, EvaluationStatus } from '@/types/evaluation';
import { TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApolloClient, useQuery } from '@apollo/client';
import { GET_ASSESSMENT_RESPONSES } from '@/lib/graphql/queries/evaluations';
import { GET_EMPLOYEES } from '@/lib/graphql/queries/employees';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EvaluationResults() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const client = useApolloClient();
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(user?.employeeId || '');
  const [viewMode, setViewMode] = useState<'received' | 'given'>('received');
  
  const canReadAll = can('evaluations:read_all');
  
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: !canReadAll,
  });

  const { cycles } = useEvaluationCycles(1, 1, '', EvaluationCycleStatus.ACTIVE);
  const activeCycle = cycles?.[0];
  
  const { assessments, loading } = useCompetencyAssessments(
    1,
    100,
    activeCycle?.evaluationCycleId,
    viewMode === 'received' ? targetEmployeeId : undefined,
    viewMode === 'given' ? user?.employeeId : undefined
  );

  const { weightConfigs } = useEvaluationWeightConfigs(activeCycle?.evaluationCycleId);

  // Filter assessments based on viewMode
  const filteredAssessments = assessments?.filter((a: any) => {
    if (viewMode === 'given') {
      // Only show assessments where I am the evaluator and it's not a SELF assessment
      return a.evaluator?.employeeId === user?.employeeId && a.relationType.toLowerCase() !== 'self';
    }
    // For 'received', use the ones fetched by targetEmployeeId (evaluatee)
    return true;
  }) || [];

  // Calculate completed assessments
  const completedAssessments = filteredAssessments?.filter(
    (a: any) => a.status === EvaluationStatus.COMPLETED || a.status === EvaluationStatus.SUBMITTED
  ) || [];

  const hasResults = completedAssessments.length > 0;

  const [calculatedScores, setCalculatedScores] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [selectedPeerAssessmentId, setSelectedPeerAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    if (completedAssessments.length === 0 || !activeCycle) {
      setCalculatedScores([]);
      setOverallScore(0);
      return;
    }

    if (viewMode === 'received') {
      calculateScores();
    } else if (selectedPeerAssessmentId) {
      calculateSingleAssessmentScores(selectedPeerAssessmentId);
    } else if (completedAssessments.length > 0) {
      // Default to first peer assessment if none selected
      setSelectedPeerAssessmentId(completedAssessments[0].competencyAssessmentId);
    }
  }, [completedAssessments.length, activeCycle?.evaluationCycleId, targetEmployeeId, viewMode, selectedPeerAssessmentId]);

  const calculateSingleAssessmentScores = async (assessmentId: string) => {
    setCalculating(true);
    try {
      const { data } = await client.query({
        query: GET_ASSESSMENT_RESPONSES,
        variables: { assessmentId, page: 1, limit: 1000 },
        fetchPolicy: 'network-only',
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

      const competencyScores = Object.entries(scoresByComp).map(([id, data]: [string, any]) => {
        const avg = data.ratings.reduce((a: number, b: number) => a + b, 0) / data.ratings.length;
        return {
          competencyId: id,
          name: data.name,
          breakdown: {
            self: 0, peer: 0, supervisor: 0, subordinate: 0, // Not applicable for single view
            given: avg
          },
          score: avg,
        };
      });

      const overall = competencyScores.length > 0
        ? competencyScores.reduce((sum, c) => sum + c.score, 0) / competencyScores.length
        : 0;

      const colors = [
        { color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
        { color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
        { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
        { color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
      ];

      setCalculatedScores(competencyScores.map((comp, idx) => ({
        ...comp,
        ...colors[idx % colors.length],
      })));
      setOverallScore(overall);
    } catch (error) {
      console.error('Error calculating single scores:', error);
    } finally {
      setCalculating(false);
    }
  };

  const calculateScores = async () => {
    setCalculating(true);
    
    try {
      // 1. Fetch all responses for completed assessments
      const allResponses: any[] = [];
      for (const assessment of completedAssessments) {
        const { data } = await client.query({
          query: GET_ASSESSMENT_RESPONSES,
          variables: {
            assessmentId: assessment.competencyAssessmentId,
            page: 1,
            limit: 1000,
          },
          fetchPolicy: 'network-only',
        });
        
        allResponses.push({
          assessment,
          responses: data?.assessmentResponses?.items || [],
        });
      }

      // 2. Group responses by competency and relation type
      const scoresByCompetency: Record<string, any> = {};
      
      allResponses.forEach(({ assessment, responses }) => {
        const relationType = assessment.relationType;
        
        responses.forEach((response: any) => {
          const competencyId = response.indicator?.competency?.competencyId;
          const competencyName = response.indicator?.competency?.name;
          
          if (!competencyId || !competencyName) return;
          
          if (!scoresByCompetency[competencyId]) {
            scoresByCompetency[competencyId] = {
              name: competencyName,
              self: [],
              peer: [],
              supervisor: [],
              subordinate: [],
            };
          }
          
          const key = relationType.toLowerCase();
          if (scoresByCompetency[competencyId][key]) {
            scoresByCompetency[competencyId][key].push(response.rating);
          }
        });
      });

      // 3. Calculate averages
      const average = (arr: number[]) => 
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const competencyScores = Object.entries(scoresByCompetency).map(([id, scores]: [string, any]) => {
        const breakdown = {
          self: average(scores.self),
          peer: average(scores.peer),
          supervisor: average(scores.supervisor),
          subordinate: average(scores.subordinate),
          weighted: 0,
        };

        return {
          competencyId: id,
          name: scores.name,
          breakdown,
          score: 0, // Will be calculated after applying weights
        };
      });

      // 4. Apply weights
      const weights: Record<string, number> = {
        self: 20,
        peer: 30,
        supervisor: 35,
        subordinate: 15,
      };

      // If weight configs exist, use them
      if (weightConfigs && weightConfigs.length > 0) {
        weightConfigs.forEach((config: any) => {
          weights[config.relationType.toLowerCase()] = config.weightPercent;
        });
      }

      competencyScores.forEach(comp => {
        // Calculate weighted score only using categories that have data
        let totalWeight = 0;
        let weightedSum = 0;

        if (comp.breakdown.self > 0) {
          weightedSum += comp.breakdown.self * weights.self;
          totalWeight += weights.self;
        }
        if (comp.breakdown.peer > 0) {
          weightedSum += comp.breakdown.peer * weights.peer;
          totalWeight += weights.peer;
        }
        if (comp.breakdown.supervisor > 0) {
          weightedSum += comp.breakdown.supervisor * weights.supervisor;
          totalWeight += weights.supervisor;
        }
        if (comp.breakdown.subordinate > 0) {
          weightedSum += comp.breakdown.subordinate * weights.subordinate;
          totalWeight += weights.subordinate;
        }

        comp.breakdown.weighted = totalWeight > 0 ? weightedSum / totalWeight : 0;
        comp.score = comp.breakdown.weighted;
      });

      // 5. Calculate overall score
      const overall = competencyScores.length > 0
        ? average(competencyScores.map(c => c.score))
        : 0;

      // 6. Add colors for display
      const colors = [
        { color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
        { color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
        { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
        { color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
      ];

      const scoresToDisplay = competencyScores.map((comp, idx) => ({
        ...comp,
        ...colors[idx % colors.length],
      }));

      setCalculatedScores(scoresToDisplay);
      setOverallScore(overall);
    } catch (error) {
      console.error('Error calculating scores:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Mock competency scores - in real app, calculate from assessment responses
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
      {/* View Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-gray-100 rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode('received')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'received'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My 360 Results
          </button>
          <button
            onClick={() => setViewMode('given')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'given'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Evaluations I Performed
          </button>
        </div>
      </div>

      {/* Employee Selector for Admins/HR (only in received mode) */}
      {canReadAll && viewMode === 'received' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="font-medium text-gray-900">View Results For:</h3>
              </div>
              <Select value={targetEmployeeId} onValueChange={setTargetEmployeeId}>
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

      {/* Peer Selector for 'given' mode */}
      {viewMode === 'given' && completedAssessments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h3 className="font-medium text-gray-900">Ratings I gave to:</h3>
              </div>
              <Select 
                value={selectedPeerAssessmentId || ''} 
                onValueChange={setSelectedPeerAssessmentId}
              >
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select a peer" />
                </SelectTrigger>
                <SelectContent>
                  {completedAssessments.map((a: any) => (
                    <SelectItem key={a.competencyAssessmentId} value={a.competencyAssessmentId}>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Yet</h3>
              <p className="text-gray-500">
                {viewMode === 'received' 
                  ? (targetEmployeeId === user?.employeeId 
                      ? "Results will be available after you complete your evaluations and they are reviewed."
                      : "No completed evaluations found for this employee.")
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
                <span className="text-6xl md:text-7xl font-bold text-indigo-600">{overallScore.toFixed(2)}</span>
                <span className="text-2xl text-gray-600">out of 5.0</span>
              </div>
              <p className={`font-medium text-lg ${
                overallScore >= 4.5 ? 'text-green-600' : 
                overallScore >= 3.5 ? 'text-blue-600' : 
                overallScore >= 2.5 ? 'text-amber-600' : 
                'text-red-600'
              }`}>
                {viewMode === 'received' ? (
                  overallScore >= 4.5 ? 'Exceeds Expectations' : 
                  overallScore >= 3.5 ? 'Meets Expectations' : 
                  overallScore >= 2.5 ? 'Needs Improvement' : 
                  'Below Expectations'
                ) : (
                   `Overall Rating given to ${completedAssessments.find((a: any) => a.competencyAssessmentId === selectedPeerAssessmentId)?.evaluatee.fullName}`
                 )}
              </p>
              {viewMode === 'received' && completedAssessments.length < 4 && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-100">
                  Note: This is a partial score based on {completedAssessments.length} completed evaluation{completedAssessments.length !== 1 ? 's' : ''}.
                </p>
              )}
            </div>
          </div>

          {/* Competency Scores Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {competencyScores.map((competency) => (
              <Card key={competency.name} className={`border-2 ${competency.borderColor}`}>
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-lg ${competency.bgColor} flex items-center justify-center mb-3`}>
                    <span className={`text-2xl font-bold ${competency.color}`}>
                      {competency.score.toFixed(1)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm leading-tight">
                    {competency.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Radar Chart</CardTitle>
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
                      <circle cx="100" cy="100" r="80" stroke="#E5E7EB" strokeWidth="1" fill="none" />
                      <circle cx="100" cy="100" r="60" stroke="#E5E7EB" strokeWidth="1" fill="none" />
                      <circle cx="100" cy="100" r="40" stroke="#E5E7EB" strokeWidth="1" fill="none" />
                      <circle cx="100" cy="100" r="20" stroke="#E5E7EB" strokeWidth="1" fill="none" />
                      
                      {/* Axes */}
                      <line x1="100" y1="100" x2="100" y2="20" stroke="#E5E7EB" strokeWidth="1" />
                      <line x1="100" y1="100" x2="180" y2="100" stroke="#E5E7EB" strokeWidth="1" />
                      <line x1="100" y1="100" x2="100" y2="180" stroke="#E5E7EB" strokeWidth="1" />
                      <line x1="100" y1="100" x2="20" y2="100" stroke="#E5E7EB" strokeWidth="1" />
                      
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
                <CardTitle className="text-base font-semibold">Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                          Competency
                        </th>
                        {viewMode === 'received' ? (
                          <>
                            <th className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                              Self
                            </th>
                            <th className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                              Peer
                            </th>
                            <th className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                              Sup.
                            </th>
                            <th className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                              Sub.
                            </th>
                          </>
                        ) : (
                          <th className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                            Rating I Gave
                          </th>
                        )}
                        <th className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                          {viewMode === 'received' ? 'Wtd.' : 'Score'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {competencyScores.map((competency) => (
                        <tr key={competency.name} className="border-b border-gray-100">
                          <td className="py-3 px-2">
                            <span className={`font-medium ${competency.color}`}>
                              {competency.name}
                            </span>
                          </td>
                          {viewMode === 'received' ? (
                            <>
                              <td className="text-center py-3 px-2 text-gray-900">
                                {competency.breakdown.self > 0 ? competency.breakdown.self.toFixed(1) : '-'}
                              </td>
                              <td className="text-center py-3 px-2 text-gray-900">
                                {competency.breakdown.peer > 0 ? competency.breakdown.peer.toFixed(1) : '-'}
                              </td>
                              <td className="text-center py-3 px-2 text-gray-900">
                                {competency.breakdown.supervisor > 0 ? competency.breakdown.supervisor.toFixed(1) : '-'}
                              </td>
                              <td className="text-center py-3 px-2 text-gray-900">
                                {competency.breakdown.subordinate > 0 ? competency.breakdown.subordinate.toFixed(1) : '-'}
                              </td>
                            </>
                          ) : (
                            <td className="text-center py-3 px-2 text-gray-900 font-medium">
                              {competency.breakdown.given.toFixed(1)}
                            </td>
                          )}
                          <td className="text-center py-3 px-2">
                            <span className={`font-semibold ${competency.color}`}>
                              {competency.score.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {viewMode === 'received' && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium mb-1 uppercase">Applied Weights</p>
                      <p className="text-xs text-gray-600">
                        Self: {weightConfigs?.find((w: any) => w.relationType.toLowerCase() === 'self')?.weightPercent || 20}% · 
                        Peer: {weightConfigs?.find((w: any) => w.relationType.toLowerCase() === 'peer')?.weightPercent || 30}% · 
                        Supervisor: {weightConfigs?.find((w: any) => w.relationType.toLowerCase() === 'supervisor')?.weightPercent || 35}% · 
                        Subordinate: {weightConfigs?.find((w: any) => w.relationType.toLowerCase() === 'subordinate')?.weightPercent || 15}%
                      </p>
                    </div>
                  )}
                  {viewMode === 'given' && (
                    <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <p className="text-xs text-indigo-700 font-medium">
                        These are the ratings you submitted for this peer during the current evaluation cycle.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
