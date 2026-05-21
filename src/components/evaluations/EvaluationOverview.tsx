'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCompetencyAssessments } from '@/hooks/evaluations/useCompetencyAssessment';
import { useEvaluationCycles } from '@/hooks/evaluations/useEvaluationCycles';
import { useAggregatePerformanceResults } from '@/hooks/performance/usePerformance';
import { EvaluationStatus, EvaluationCycleStatus } from '@/types/evaluation';
import { useRouter } from 'next/navigation';
import { useApolloClient } from '@apollo/client';
import { GET_ASSESSMENT_RESPONSES } from '@/lib/graphql/queries/evaluations';
import React, { useEffect, useState } from 'react';

export default function EvaluationOverview() {
  const router = useRouter();
  const { user } = useAuth();
  const client = useApolloClient();
  const { cycles, loading: cyclesLoading } = useEvaluationCycles(1, 1, '', EvaluationCycleStatus.ACTIVE);
  const activeCycle = cycles?.[0];

  const { assessments: receivedAssessments, loading: receivedLoading } = useCompetencyAssessments(
    1,
    100,
    activeCycle?.evaluationCycleId,
    user?.employeeId
  );

  const { assessments: givenAssessments, loading: givenLoading } = useCompetencyAssessments(
    1,
    100,
    activeCycle?.evaluationCycleId,
    undefined,
    user?.employeeId
  );

  const { results: performanceResults, loading: performanceLoading } = useAggregatePerformanceResults({
    userId: user?.employeeId,
    strategicPeriodId: activeCycle?.strategicPeriod?.strategicPeriodId,
  });

  const [selfScores, setSelfScores] = useState<any[]>([]);
  const [loadingSelf, setLoadingSelf] = useState(false);
  const [peerRatingsGiven, setPeerRatingsGiven] = useState<any[]>([]);
  const [loadingPeerRatings, setLoadingPeerRatings] = useState(false);

  const selfAssessment = receivedAssessments?.find((a: any) => a.relationType.toLowerCase() === 'self');
  const isSelfDone = selfAssessment?.status === EvaluationStatus.SUBMITTED || selfAssessment?.status === EvaluationStatus.COMPLETED;

  // Assessments where I am the evaluator and it's a PEER relation
  const completedPeerAssessments = givenAssessments?.filter(
    (a: any) => a.relationType.toLowerCase() === 'peer' && (a.status === EvaluationStatus.SUBMITTED || a.status === EvaluationStatus.COMPLETED)
  ) || [];

  useEffect(() => {
    if (isSelfDone && selfAssessment) {
      fetchSelfScores();
    }
  }, [isSelfDone, selfAssessment?.competencyAssessmentId]);

  useEffect(() => {
    if (completedPeerAssessments.length > 0) {
      fetchPeerRatingsGiven();
    }
  }, [completedPeerAssessments.length]);

  const fetchSelfScores = async () => {
    setLoadingSelf(true);
    try {
      const { data } = await client.query({
        query: GET_ASSESSMENT_RESPONSES,
        variables: {
          assessmentId: selfAssessment.competencyAssessmentId,
          page: 1,
          limit: 1000,
        },
      });

      const responses = data?.assessmentResponses?.items || [];
      const scoresByComp: Record<string, { name: string; ratings: number[] }> = {};

      responses.forEach((resp: any) => {
        const compId = resp.indicator.competency.competencyId;
        const compName = resp.indicator.competency.name;
        if (!scoresByComp[compId]) {
          scoresByComp[compId] = { name: compName, ratings: [] };
        }
        scoresByComp[compId].ratings.push(resp.rating);
      });

      const calculated = Object.values(scoresByComp).map(comp => ({
        name: comp.name,
        score: comp.ratings.reduce((a, b) => a + b, 0) / comp.ratings.length,
      }));

      setSelfScores(calculated);
    } catch (error) {
      console.error('Error fetching self scores:', error);
    } finally {
      setLoadingSelf(false);
    }
  };

  const fetchPeerRatingsGiven = async () => {
    setLoadingPeerRatings(true);
    try {
      const results = [];
      for (const assessment of completedPeerAssessments) {
        const { data } = await client.query({
          query: GET_ASSESSMENT_RESPONSES,
          variables: {
            assessmentId: assessment.competencyAssessmentId,
            page: 1,
            limit: 1000,
          },
        });

        const responses = data?.assessmentResponses?.items || [];
        if (responses.length > 0) {
          const avgScore = responses.reduce((sum: number, r: any) => sum + r.rating, 0) / responses.length;
          results.push({
            assessmentId: assessment.competencyAssessmentId,
            peerName: assessment.evaluatee.fullName,
            score: avgScore,
            status: assessment.status,
          });
        }
      }
      setPeerRatingsGiven(results);
    } catch (error) {
      console.error('Error fetching peer ratings given:', error);
    } finally {
      setLoadingPeerRatings(false);
    }
  };

  const latestResult = performanceResults?.[0];
  
  // Calculate statistics
  const totalEvaluations = givenAssessments?.length || 0;
  const completedEvaluations = givenAssessments?.filter(
    (a: any) => a.status === EvaluationStatus.COMPLETED || a.status === EvaluationStatus.SUBMITTED
  ).length || 0;
  const pendingEvaluations = givenAssessments?.filter(
    (a: any) => a.status === EvaluationStatus.NOT_STARTED || a.status === EvaluationStatus.IN_PROGRESS
  ).length || 0;

  // Calculate overdue evaluations
  const isCycleOverdue = activeCycle ? new Date(activeCycle.endDate) < new Date() : false;
  const overdueEvaluations = isCycleOverdue ? pendingEvaluations : 0;

  // Use real competency score if available
  const averageScore = latestResult?.competencyScore || 0;

  // Calculate days left
  const daysLeft = activeCycle
    ? Math.ceil(
        (new Date(activeCycle.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  // Get pending actions (things I need to do)
  const pendingActions = givenAssessments?.filter(
    (a: any) => a.status === EvaluationStatus.NOT_STARTED || a.status === EvaluationStatus.IN_PROGRESS
  ) || [];

  const handleStartEvaluation = (assessmentId: string) => {
    router.push(`/dashboard/evaluations/assess/${assessmentId}`);
  };

  if (cyclesLoading || receivedLoading || givenLoading || performanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {pendingEvaluations > 0 && daysLeft > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <span className="font-semibold">{pendingEvaluations} evaluations pending</span> — Complete
            before {activeCycle?.endDate && new Date(activeCycle.endDate).toLocaleDateString()} to avoid
            affecting your performance review.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">My Evals</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold text-gray-900">{totalEvaluations}</p>
              </div>
              <p className="text-xs text-gray-500">
                {completedEvaluations} done · {pendingEvaluations} pending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Overall Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold text-gray-900">
                  {averageScore.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">/5.0</p>
              </div>
              <p className="text-xs text-gray-500">Official weighted score</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Deadline</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold text-gray-900">
                  {activeCycle?.endDate
                    ? new Date(activeCycle.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
              <p className="text-xs text-gray-500">{daysLeft} days left</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Overdue</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-semibold ${overdueEvaluations > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {overdueEvaluations}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {overdueEvaluations > 0 ? 'Action required' : 'All on track'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Pending Actions</CardTitle>
            <Button variant="link" className="text-sm text-indigo-600 p-0 h-auto">
              View All →
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingActions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No pending evaluations</p>
              </div>
            ) : (
              pendingActions.slice(0, 3).map((assessment: any) => {
                const initials = assessment.evaluatee.fullName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase();
                
                const relationColors: Record<string, string> = {
                  self: 'bg-indigo-100 text-indigo-700',
                  supervisor: 'bg-amber-100 text-amber-700',
                  peer: 'bg-green-100 text-green-700',
                  subordinate: 'bg-purple-100 text-purple-700',
                };

                const relationColor = relationColors[assessment.relationType.toLowerCase()] || 'bg-gray-100 text-gray-700';

                return (
                  <div
                    key={assessment.competencyAssessmentId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{assessment.evaluatee.fullName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded ${relationColor}`}>
                            {assessment.relationType.charAt(0) + assessment.relationType.slice(1).toLowerCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {assessment.status === EvaluationStatus.NOT_STARTED ? '0%' : '33%'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartEvaluation(assessment.competencyAssessmentId)}
                      className={
                        assessment.status === EvaluationStatus.IN_PROGRESS
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : ''
                      }
                    >
                      {assessment.status === EvaluationStatus.IN_PROGRESS ? 'Continue' : 'Start'}
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Score Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Self Assessment Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingSelf ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading scores...</p>
              </div>
            ) : !isSelfDone ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Complete your self-assessment to see your scores</p>
                {selfAssessment && (
                  <Button
                    variant="link"
                    className="text-indigo-600 mt-2"
                    onClick={() => handleStartEvaluation(selfAssessment.competencyAssessmentId)}
                  >
                    Start Now →
                  </Button>
                )}
              </div>
            ) : selfScores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No scores available for this assessment</p>
              </div>
            ) : (
              selfScores.map((comp, idx) => {
                const colors = [
                  'bg-indigo-600',
                  'bg-teal-600',
                  'bg-amber-600',
                  'bg-purple-600',
                ];
                const textColor = colors[idx % colors.length].replace('bg-', 'text-');
                
                return (
                  <div key={comp.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 uppercase text-xs font-medium">
                        {comp.name}
                      </span>
                      <span className={`font-semibold ${textColor}`}>
                        {comp.score.toFixed(1)}
                      </span>
                    </div>
                    <Progress value={comp.score * 20} className={`h-2 [&>div]:${colors[idx % colors.length]}`} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Peer Ratings Given */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Peer Ratings I've Given</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPeerRatings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading peer ratings...</p>
              </div>
            ) : peerRatingsGiven.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">You haven't completed any peer evaluations yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {peerRatingsGiven.map((item) => (
                  <div key={item.assessmentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                        {item.peerName.split(' ').map((n: any) => n[0]).join('').toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.peerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold text-indigo-600">
                        {item.score.toFixed(1)} <span className="text-xs text-gray-400 font-normal">/ 5.0</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        onClick={() => router.push(`/dashboard/evaluations/assess/${item.assessmentId}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
