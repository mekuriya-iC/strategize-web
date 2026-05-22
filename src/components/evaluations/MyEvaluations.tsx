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
    if (!assessmentId) return;
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
      <div className="flex items-center gap-1 border-b border-gray-100 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            filterStatus === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            filterStatus === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setFilterStatus('in-progress')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            filterStatus === 'in-progress'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          In Progress ({counts.inProgress})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            filterStatus === 'completed'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Completed ({counts.completed})
        </button>
      </div>

      {/* Evaluations List */}
      <div className="space-y-4">
        {!filteredAssessments || filteredAssessments.length === 0 ? (
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardContent className="py-20 text-center">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No evaluations found</p>
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
            const isCompleted = assessment.status === EvaluationStatus.COMPLETED || assessment.status === EvaluationStatus.SUBMITTED;

            return (
              <Card key={assessment.competencyAssessmentId} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm ${
                          isSelf ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-gray-400'
                        }`}
                      >
                        {isSelf ? initials[0] : initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-gray-900 truncate">
                            {isSelf ? 'Yourself' : assessment.evaluatee.fullName}
                          </p>
                          <Badge className={`text-[10px] font-bold uppercase tracking-tighter px-1.5 py-0 h-4 border-none ${
                            assessment.relationType.toLowerCase() === 'self' ? 'bg-indigo-50 text-indigo-600' :
                            assessment.relationType.toLowerCase() === 'peer' ? 'bg-teal-50 text-teal-600' :
                            assessment.relationType.toLowerCase() === 'supervisor' ? 'bg-amber-50 text-amber-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>
                            {assessment.relationType}
                          </Badge>
                        </div>
                        
                        {/* Progress */}
                        <div className="flex items-center gap-4 max-w-md">
                          <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted ? 'bg-green-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap uppercase tracking-wider">
                            {progress}% · 17 indicators
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Action */}
                    <div className="flex items-center gap-8">
                      {isCompleted ? (
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Completed</p>
                          <p className="text-xs font-bold text-gray-400">Submitted: {new Date(assessment.updatedAt || assessment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                      ) : (
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Not Started</p>
                          <p className="text-xs font-bold text-gray-300">Awaiting your input</p>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => handleStartEvaluation(assessment.competencyAssessmentId)}
                        variant={isCompleted ? "outline" : "default"}
                        className={`min-w-[100px] h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest ${
                          isCompleted 
                            ? 'border-gray-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100' 
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                        }`}
                      >
                        {isCompleted ? 'View' : (assessment.status === EvaluationStatus.IN_PROGRESS ? 'Continue' : 'Start')}
                      </Button>
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
