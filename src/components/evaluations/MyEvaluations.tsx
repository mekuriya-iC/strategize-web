'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCompetencyAssessments } from '@/hooks/evaluations/useCompetencyAssessment';
import { useEvaluationCycles } from '@/hooks/evaluations/useEvaluationCycles';
import { EvaluationStatus, EvaluationRelationType, EvaluationCycleStatus } from '@/types/evaluation';
import { useRouter } from 'next/navigation';

type FilterStatus = 'all' | 'pending' | 'in-progress' | 'completed';

export default function MyEvaluations() {
  const router = useRouter();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  
  const { cycles } = useEvaluationCycles(1, 1, '', EvaluationCycleStatus.ACTIVE);
  const activeCycle = cycles?.[0];
  
  const { assessments, loading } = useCompetencyAssessments(
    1,
    100,
    activeCycle?.evaluationCycleId,
    undefined,
    user?.employeeId // Get assessments where current user is the evaluator
  );

  const getStatusBadge = (status: EvaluationStatus) => {
    const statusConfig = {
      [EvaluationStatus.NOT_STARTED]: {
        label: 'Not Started',
        className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
      },
      [EvaluationStatus.IN_PROGRESS]: {
        label: 'In Progress',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      },
      [EvaluationStatus.SUBMITTED]: {
        label: 'Submitted',
        className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
      },
      [EvaluationStatus.COMPLETED]: {
        label: 'Completed',
        className: 'bg-green-100 text-green-700 hover:bg-green-100',
      },
    };

    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getRelationBadge = (relationType: EvaluationRelationType) => {
    const relationConfig = {
      [EvaluationRelationType.SELF]: {
        label: 'Self',
        className: 'bg-indigo-100 text-indigo-700',
      },
      [EvaluationRelationType.SUPERVISOR]: {
        label: 'Supervisor',
        className: 'bg-amber-100 text-amber-700',
      },
      [EvaluationRelationType.PEER]: {
        label: 'Peer',
        className: 'bg-green-100 text-green-700',
      },
      [EvaluationRelationType.SUBORDINATE]: {
        label: 'Subordinate',
        className: 'bg-purple-100 text-purple-700',
      },
    };

    const config = relationConfig[relationType];
    return (
      <span className={`text-xs px-2 py-1 rounded ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getProgress = (status: EvaluationStatus) => {
    switch (status) {
      case EvaluationStatus.NOT_STARTED:
        return 0;
      case EvaluationStatus.IN_PROGRESS:
        return 33;
      case EvaluationStatus.SUBMITTED:
        return 100;
      case EvaluationStatus.COMPLETED:
        return 100;
      default:
        return 0;
    }
  };

  const filteredAssessments = assessments?.filter((assessment: any) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return assessment.status === EvaluationStatus.NOT_STARTED;
    if (filterStatus === 'in-progress') return assessment.status === EvaluationStatus.IN_PROGRESS;
    if (filterStatus === 'completed')
      return (
        assessment.status === EvaluationStatus.COMPLETED ||
        assessment.status === EvaluationStatus.SUBMITTED
      );
    return true;
  });

  const counts = {
    all: assessments?.length || 0,
    pending: assessments?.filter((a: any) => a.status === EvaluationStatus.NOT_STARTED).length || 0,
    inProgress: assessments?.filter((a: any) => a.status === EvaluationStatus.IN_PROGRESS).length || 0,
    completed:
      assessments?.filter(
        (a: any) =>
          a.status === EvaluationStatus.COMPLETED || a.status === EvaluationStatus.SUBMITTED
      ).length || 0,
  };

  const handleStartEvaluation = (assessmentId: string) => {
    router.push(`/dashboard/evaluations/assess/${assessmentId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterStatus === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterStatus === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setFilterStatus('in-progress')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterStatus === 'in-progress'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          In Progress ({counts.inProgress})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterStatus === 'completed'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed ({counts.completed})
        </button>
      </div>

      {/* Evaluations List */}
      <div className="space-y-3">
        {!filteredAssessments || filteredAssessments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No evaluations found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssessments.map((assessment: any) => {
            const initials = assessment.evaluatee.fullName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase();
            
            const progress = getProgress(assessment.status);
            const isSelf = assessment.relationType === EvaluationRelationType.SELF;

            return (
              <Card key={assessment.competencyAssessmentId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                          isSelf ? 'bg-indigo-600' : 'bg-gray-400'
                        }`}
                      >
                        {isSelf ? 'Y' : initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">
                            {isSelf ? 'Yourself' : assessment.evaluatee.fullName}
                          </p>
                          {getRelationBadge(assessment.relationType)}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="flex items-center gap-3">
                          <Progress value={progress} className="h-2 flex-1 max-w-xs" />
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {progress}% · 17 indicators
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Action */}
                    <div className="flex items-center gap-3">
                      {assessment.status === EvaluationStatus.COMPLETED && (
                        <div className="text-right mr-2">
                          <p className="text-sm font-medium text-green-600">Completed</p>
                          <p className="text-xs text-gray-500">
                            Score: 4.2/5
                          </p>
                          {assessment.submittedAt && (
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(assessment.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {assessment.status === EvaluationStatus.SUBMITTED && (
                        <div className="text-right mr-2">
                          {getStatusBadge(assessment.status)}
                          {assessment.submittedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(assessment.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {(assessment.status === EvaluationStatus.NOT_STARTED ||
                        assessment.status === EvaluationStatus.IN_PROGRESS) && (
                        <>
                          {getStatusBadge(assessment.status)}
                          <Button
                            onClick={() => handleStartEvaluation(assessment.competencyAssessmentId)}
                            className={
                              assessment.status === EvaluationStatus.IN_PROGRESS
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : ''
                            }
                          >
                            {assessment.status === EvaluationStatus.IN_PROGRESS
                              ? 'Continue'
                              : 'Start'}
                          </Button>
                        </>
                      )}

                      {assessment.status === EvaluationStatus.COMPLETED && (
                        <Button
                          variant="outline"
                          onClick={() => handleStartEvaluation(assessment.competencyAssessmentId)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
