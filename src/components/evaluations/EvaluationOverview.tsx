'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      {/* Header with Title and Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">360° Behavioral Competence Evaluation</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{activeCycle?.name || 'Current Cycle'}</span>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">
              ● ACTIVE
            </span>
          </div>
        </div>
        <Button variant="outline" className="text-gray-600 border-gray-200">
          <TrendingUp className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Alert Banner */}
      {pendingEvaluations > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-sm text-amber-800">
            <span className="font-bold">{pendingEvaluations} evaluations pending</span> — Complete
            before {activeCycle?.endDate && new Date(activeCycle.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to avoid
            affecting your performance review.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">My Evals</p>
                <p className="text-3xl font-bold text-gray-900">{totalEvaluations}</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {completedEvaluations} done · {pendingEvaluations} pending
                </p>
              </div>
              <div className="text-indigo-600 font-bold text-xl opacity-20">6</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Score</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-gray-900">{averageScore.toFixed(1)}</p>
                <p className="text-sm font-bold text-gray-400">/5.0</p>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Based on received ratings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deadline</p>
              <p className="text-3xl font-bold text-gray-900">
                {activeCycle?.endDate
                  ? new Date(activeCycle.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">{daysLeft} days left</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overdue</p>
              <p className="text-3xl font-bold text-gray-900">{overdueEvaluations}</p>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-tight">All on track</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-gray-900">Pending Actions</CardTitle>
            <Button variant="link" className="text-xs font-bold text-indigo-600 uppercase tracking-wider p-0 h-auto">
              View All →
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingActions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500 font-medium">All evaluations completed! 🎉</p>
                </div>
              ) : (
                pendingActions.map((action: any) => (
                  <div key={action.competencyAssessmentId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {action.evaluatee.fullName.split(' ').map((n: any) => n[0]).join('')}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{action.evaluatee.fullName}</p>
                          <Badge className={`text-[10px] font-bold uppercase tracking-tighter px-1.5 py-0 h-4 border-none ${
                            action.relationType.toLowerCase() === 'peer' ? 'bg-teal-50 text-teal-600' :
                            action.relationType.toLowerCase() === 'supervisor' ? 'bg-amber-50 text-amber-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>
                            {action.relationType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 w-32">
                          <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full" 
                              style={{ width: `${action.status === EvaluationStatus.IN_PROGRESS ? 33 : 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">
                            {action.status === EvaluationStatus.IN_PROGRESS ? '33%' : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className={`h-8 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                        action.status === EvaluationStatus.IN_PROGRESS 
                          ? 'bg-indigo-600 hover:bg-indigo-700' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                      onClick={() => handleStartEvaluation(action.competencyAssessmentId)}
                    >
                      {action.status === EvaluationStatus.IN_PROGRESS ? 'Continue' : 'Start'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Score Summary */}
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Score Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selfScores.length === 0 ? (
                <div className="col-span-2 py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No scores available yet</p>
                  <p className="text-[10px] text-gray-400 mt-1">Complete your self-assessment to see results</p>
                </div>
              ) : (
                selfScores.map((score, idx) => {
                  const colors = [
                    { text: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-600', border: 'border-indigo-100' },
                    { text: 'text-teal-600', bg: 'bg-teal-50', bar: 'bg-teal-600', border: 'border-teal-100' },
                    { text: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-600', border: 'border-amber-100' },
                    { text: 'text-purple-600', bg: 'bg-purple-50', bar: 'bg-purple-600', border: 'border-purple-100' },
                  ];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={score.name} className={`p-3 rounded-xl border ${color.bg} ${color.border} space-y-2`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${color.text}`}>
                        {score.name}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-lg font-bold text-gray-900">{score.score.toFixed(1)}</p>
                        <p className="text-[10px] font-bold text-gray-400">/5</p>
                      </div>
                      <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${color.bar} rounded-full`} 
                          style={{ width: `${(score.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
