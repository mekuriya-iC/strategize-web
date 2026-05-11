'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { useCompetencyAssessment, useCompetencyAssessmentMutations } from '@/hooks/evaluations/useCompetencyAssessment';
import { useCompetencies } from '@/hooks/competencies/useCompetencies';
import { EvaluationStatus } from '@/types/evaluation';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ASSESSMENT_RESPONSES } from '@/lib/graphql/queries/evaluations';
import { CREATE_ASSESSMENT_RESPONSE } from '@/lib/graphql/mutations/evaluations';

// Component to fetch and display indicators for a competency
function CompetencyIndicators({ 
  competencyId, 
  competencyName,
  assessmentId,
  responses,
  onRatingChange,
  onCommentChange,
  onIndicatorCountChange
}: any) {
  const { data, loading } = useQuery(
    require('@/lib/graphql/queries/competencies').GET_COMPETENCY_INDICATORS,
    {
      variables: { competencyId, page: 1, limit: 100 },
      fetchPolicy: 'cache-and-network',
    }
  );

  const indicators = data?.competencyIndicators?.items || [];

  // Report indicator count to parent
  useEffect(() => {
    if (indicators.length > 0 && onIndicatorCountChange) {
      onIndicatorCountChange(competencyId, indicators.length);
    }
  }, [indicators.length, competencyId, onIndicatorCountChange]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-gray-500">Loading indicators...</p>
        </CardContent>
      </Card>
    );
  }

  if (indicators.length === 0) {
    return null;
  }

  return (
    <>
      {indicators.map((indicator: any, index: number) => {
        const response = responses[indicator.competencyIndicatorId] || { rating: 0, comment: '' };
        
        return (
          <Card key={indicator.competencyIndicatorId}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-indigo-600 uppercase mb-1">
                        {competencyName}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {indicator.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating Scale */}
                <div className="space-y-2">
                  <Label>Rating ({indicator.ratingScaleMin}-{indicator.ratingScaleMax})</Label>
                  <div className="flex items-center gap-2">
                    {Array.from(
                      { length: indicator.ratingScaleMax - indicator.ratingScaleMin + 1 },
                      (_, i) => indicator.ratingScaleMin + i
                    ).map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => onRatingChange(indicator.competencyIndicatorId, rating)}
                        className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
                          response.rating === rating
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-300 hover:border-indigo-400 text-gray-700'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <Label htmlFor={`comment-${indicator.competencyIndicatorId}`}>
                    Comments (Optional)
                  </Label>
                  <Textarea
                    id={`comment-${indicator.competencyIndicatorId}`}
                    value={response.comment}
                    onChange={(e) => onCommentChange(indicator.competencyIndicatorId, e.target.value)}
                    placeholder="Add specific examples or feedback..."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

export default function AssessmentFormPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;

  const { assessment, loading: assessmentLoading } = useCompetencyAssessment(assessmentId);
  const { updateAssessment } = useCompetencyAssessmentMutations();
  const { competencies, loading: competenciesLoading } = useCompetencies(1, 100);
  
  // Get existing responses
  const { data: responsesData } = useQuery(GET_ASSESSMENT_RESPONSES, {
    variables: { assessmentId, page: 1, limit: 1000 },
    skip: !assessmentId,
  });

  const [createResponse] = useMutation(CREATE_ASSESSMENT_RESPONSE, {
    refetchQueries: [GET_ASSESSMENT_RESPONSES],
  });

  const [responses, setResponses] = useState<Record<string, { rating: number; comment: string }>>({});
  const [overallComment, setOverallComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [indicatorCounts, setIndicatorCounts] = useState<Record<string, number>>({});
  
  const totalIndicators = Object.values(indicatorCounts).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    if (assessment?.overallComment) {
      setOverallComment(assessment.overallComment);
    }
  }, [assessment]);

  // Load existing responses
  useEffect(() => {
    if (responsesData?.assessmentResponses?.items) {
      const existingResponses: Record<string, { rating: number; comment: string }> = {};
      responsesData.assessmentResponses.items.forEach((resp: any) => {
        existingResponses[resp.indicator.competencyIndicatorId] = {
          rating: resp.rating,
          comment: resp.comment || '',
        };
      });
      setResponses(existingResponses);
    }
  }, [responsesData]);

  const handleIndicatorCountChange = useCallback((competencyId: string, count: number) => {
    setIndicatorCounts(prev => {
      // Only update if the count has changed to prevent infinite loops
      if (prev[competencyId] === count) {
        return prev;
      }
      return { ...prev, [competencyId]: count };
    });
  }, []);

  const handleRatingChange = (indicatorId: string, rating: number) => {
    setResponses(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        rating,
      },
    }));
  };

  const handleCommentChange = (indicatorId: string, comment: string) => {
    setResponses(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        comment,
      },
    }));
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      // Save all responses
      for (const [indicatorId, response] of Object.entries(responses)) {
        if (response.rating) {
          await createResponse({
            variables: {
              createAssessmentResponseInput: {
                assessmentId,
                indicatorId,
                rating: response.rating,
                comment: response.comment || '',
              },
            },
          });
        }
      }

      // Update assessment status to IN_PROGRESS
      await updateAssessment({
        competencyAssessmentId: assessmentId,
        status: EvaluationStatus.IN_PROGRESS,
        overallComment,
      });

      toast.success('Progress saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all indicators are rated
    const unratedCount = totalIndicators - Object.values(responses).filter(r => r?.rating).length;
    
    if (unratedCount > 0) {
      toast.error(`Please rate all indicators (${unratedCount} remaining)`);
      return;
    }

    setSaving(true);
    try {
      // Save all responses
      for (const [indicatorId, response] of Object.entries(responses)) {
        await createResponse({
          variables: {
            createAssessmentResponseInput: {
              assessmentId,
              indicatorId,
              rating: response.rating,
              comment: response.comment || '',
            },
          },
        });
      }

      // Update assessment status to SUBMITTED
      await updateAssessment({
        competencyAssessmentId: assessmentId,
        status: EvaluationStatus.SUBMITTED,
        overallComment,
        submittedAt: new Date().toISOString(),
      });

      toast.success('Assessment submitted successfully');
      router.push('/dashboard/evaluations?tab=my-evaluations');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit assessment');
    } finally {
      setSaving(false);
    }
  };

  const completedCount = Object.values(responses).filter(r => r?.rating).length;
  const progress = totalIndicators > 0 ? (completedCount / totalIndicators) * 100 : 0;

  // Filter to only active competencies
  const activeCompetencies = competencies.filter((c: any) => c.isActive);

  if (assessmentLoading || competenciesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Assessment not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const relationTypeColors: Record<string, string> = {
    SELF: 'bg-indigo-100 text-indigo-700',
    SUPERVISOR: 'bg-amber-100 text-amber-700',
    PEER: 'bg-green-100 text-green-700',
    SUBORDINATE: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Assessment Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">
                {assessment.relationType === 'SELF' ? 'Self' : assessment.evaluatee.fullName} Evaluation
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {assessment.evaluationCycle.name}
              </p>
            </div>
            <Badge className={relationTypeColors[assessment.relationType]}>
              {assessment.relationType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{completedCount} of {totalIndicators} indicators</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Indicators by Competency */}
      <div className="space-y-6">
        {activeCompetencies.map((competency: any) => (
          <CompetencyIndicators
            key={competency.competencyId}
            competencyId={competency.competencyId}
            competencyName={competency.name}
            assessmentId={assessmentId}
            responses={responses}
            onRatingChange={handleRatingChange}
            onCommentChange={handleCommentChange}
            onIndicatorCountChange={handleIndicatorCountChange}
          />
        ))}
        
        {activeCompetencies.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No competencies configured for evaluation</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overall Comment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
            placeholder="Provide overall feedback and summary..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pb-8">
        <Button
          variant="outline"
          onClick={handleSaveProgress}
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Progress
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || completedCount < totalIndicators}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Send className="h-4 w-4" />
          {saving ? 'Submitting...' : 'Submit Assessment'}
        </Button>
      </div>
    </div>
  );
}
