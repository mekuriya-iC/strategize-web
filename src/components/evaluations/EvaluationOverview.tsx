'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCompetencyAssessments } from '@/hooks/evaluations/useCompetencyAssessment';
import { useEvaluationCycles } from '@/hooks/evaluations/useEvaluationCycles';
import { EvaluationStatus, EvaluationCycleStatus } from '@/types/evaluation';

export default function EvaluationOverview() {
  const { user } = useAuth();
  const { cycles, loading: cyclesLoading } = useEvaluationCycles(1, 1, '', EvaluationCycleStatus.ACTIVE);
  const { assessments, loading: assessmentsLoading } = useCompetencyAssessments(
    1,
    100,
    cycles?.[0]?.evaluationCycleId,
    user?.employeeId
  );

  const activeCycle = cycles?.[0];
  
  // Calculate statistics
  const totalEvaluations = assessments?.length || 0;
  const completedEvaluations = assessments?.filter(
    (a: any) => a.status === EvaluationStatus.COMPLETED || a.status === EvaluationStatus.SUBMITTED
  ).length || 0;
  const pendingEvaluations = assessments?.filter(
    (a: any) => a.status === EvaluationStatus.NOT_STARTED || a.status === EvaluationStatus.IN_PROGRESS
  ).length || 0;

  // Calculate average score (mock for now)
  const averageScore = completedEvaluations > 0 ? 4.0 : 0;

  // Calculate days left
  const daysLeft = activeCycle
    ? Math.ceil(
        (new Date(activeCycle.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  // Get pending actions
  const pendingActions = assessments?.filter(
    (a: any) => a.status === EvaluationStatus.NOT_STARTED || a.status === EvaluationStatus.IN_PROGRESS
  ) || [];

  if (cyclesLoading || assessmentsLoading) {
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
              <p className="text-sm text-gray-600">Avg Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold text-gray-900">
                  {averageScore.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">/5.0</p>
              </div>
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
                <p className="text-3xl font-semibold text-gray-900">0</p>
              </div>
              <p className="text-xs text-gray-500">All on track</p>
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
                  SELF: 'bg-indigo-100 text-indigo-700',
                  SUPERVISOR: 'bg-amber-100 text-amber-700',
                  PEER: 'bg-green-100 text-green-700',
                  SUBORDINATE: 'bg-purple-100 text-purple-700',
                };

                const relationColor = relationColors[assessment.relationType] || 'bg-gray-100 text-gray-700';

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
            <CardTitle className="text-base font-semibold">Score Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedEvaluations === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Complete evaluations to see your scores</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 uppercase text-xs font-medium">
                      Leadership & Decision Making
                    </span>
                    <span className="font-semibold text-indigo-600">3.8</span>
                  </div>
                  <Progress value={76} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 uppercase text-xs font-medium">
                      Communication & Collaboration
                    </span>
                    <span className="font-semibold text-teal-600">4.7</span>
                  </div>
                  <Progress value={94} className="h-2 [&>div]:bg-teal-600" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 uppercase text-xs font-medium">
                      Innovation & Problem Solving
                    </span>
                    <span className="font-semibold text-amber-600">4.2</span>
                  </div>
                  <Progress value={84} className="h-2 [&>div]:bg-amber-600" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 uppercase text-xs font-medium">
                      Accountability & Integrity
                    </span>
                    <span className="font-semibold text-purple-600">4.9</span>
                  </div>
                  <Progress value={98} className="h-2 [&>div]:bg-purple-600" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
