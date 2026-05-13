'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCompetencyAssessments, useAssessmentResponses } from '@/hooks/evaluations/useCompetencyAssessment';
import { useEvaluationCycles } from '@/hooks/evaluations/useEvaluationCycles';
import { useEvaluationWeightConfigs } from '@/hooks/evaluations/useEvaluationWeights';
import { EvaluationCycleStatus, EvaluationStatus } from '@/types/evaluation';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { GET_ASSESSMENT_RESPONSES } from '@/lib/graphql/queries/evaluations';

export default function EvaluationResults() {
  const { user } = useAuth();
  const client = useApolloClient();
  const { cycles } = useEvaluationCycles(1, 1, '', EvaluationCycleStatus.ACTIVE);
  const activeCycle = cycles?.[0];
  
  const { assessments, loading } = useCompetencyAssessments(
    1,
    100,
    activeCycle?.evaluationCycleId,
    user?.employeeId
  );

  const { weightConfigs } = useEvaluationWeightConfigs(activeCycle?.evaluationCycleId);

  // Calculate completed assessments
  const completedAssessments = assessments?.filter(
    (a: any) => a.status === EvaluationStatus.COMPLETED || a.status === EvaluationStatus.SUBMITTED
  ) || [];

  const hasResults = completedAssessments.length > 0;

  const [calculatedScores, setCalculatedScores] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (completedAssessments.length === 0 || !activeCycle) {
      return;
    }

    calculateScores();
  }, [completedAssessments.length, activeCycle?.evaluationCycleId]);

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
              SELF: [],
              PEER: [],
              SUPERVISOR: [],
              SUBORDINATE: [],
            };
          }
          
          scoresByCompetency[competencyId][relationType].push(response.rating);
        });
      });

      // 3. Calculate averages
      const average = (arr: number[]) => 
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const competencyScores = Object.entries(scoresByCompetency).map(([id, scores]: [string, any]) => {
        const breakdown = {
          self: average(scores.SELF),
          peer: average(scores.PEER),
          supervisor: average(scores.SUPERVISOR),
          subordinate: average(scores.SUBORDINATE),
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
        SELF: 20,
        PEER: 30,
        SUPERVISOR: 35,
        SUBORDINATE: 15,
      };

      // If weight configs exist, use them
      if (weightConfigs && weightConfigs.length > 0) {
        weightConfigs.forEach((config: any) => {
          weights[config.relationType] = config.weightPercent;
        });
      }

      competencyScores.forEach(comp => {
        comp.breakdown.weighted = 
          (comp.breakdown.self * weights.SELF / 100) +
          (comp.breakdown.peer * weights.PEER / 100) +
          (comp.breakdown.supervisor * weights.SUPERVISOR / 100) +
          (comp.breakdown.subordinate * weights.SUBORDINATE / 100);
        
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

  if (!hasResults) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Yet</h3>
              <p className="text-gray-500">
                Results will be available after you complete your evaluations and they are reviewed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Section */}
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
            {overallScore >= 4.5 ? 'Exceeds Expectations' : 
             overallScore >= 3.5 ? 'Meets Expectations' : 
             overallScore >= 2.5 ? 'Needs Improvement' : 
             'Below Expectations'}
          </p>
        </div>
      </div>

      {/* Competency Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {competencyScores.map((competency) => (
          <Card key={competency.name} className={`border-2 ${competency.borderColor}`}>
            <CardContent className="pt-6">
              <div className={`w-12 h-12 rounded-lg ${competency.bgColor} flex items-center justify-center mb-3`}>
                <span className={`text-2xl font-bold ${competency.color}`}>
                  {competency.score}
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
                    <th className="text-center py-3 px-2 font-medium text-gray-500 uppercase text-xs">
                      Wtd.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competencyScores.map((competency, index) => (
                    <tr key={competency.name} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <span className={`font-medium ${competency.color}`}>
                          {competency.name}
                        </span>
                      </td>
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
                      <td className="text-center py-3 px-2">
                        <span className={`font-semibold ${competency.color}`}>
                          {competency.breakdown.weighted.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-4">
                Weights: Self {weightConfigs?.find((w: any) => w.relationType === 'SELF')?.weightPercent || 20}% · 
                Peer {weightConfigs?.find((w: any) => w.relationType === 'PEER')?.weightPercent || 30}% · 
                Sup {weightConfigs?.find((w: any) => w.relationType === 'SUPERVISOR')?.weightPercent || 35}% · 
                Sub {weightConfigs?.find((w: any) => w.relationType === 'SUBORDINATE')?.weightPercent || 15}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
