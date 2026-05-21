'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Search, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_EMPLOYEES } from '@/lib/graphql/queries/employees';
import { GET_EVALUATOR_CANDIDATES, GET_DEFAULT_WEIGHTS, GET_COMPETENCY_ASSESSMENTS } from '@/lib/graphql/queries/evaluations';
import { BULK_ASSIGN_EVALUATORS } from '@/lib/graphql/mutations/evaluations';
import { EvaluationRelationType } from '@/types/evaluation';
import { toast } from 'sonner';

interface AssignEvaluatorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationCycleId: string;
  evaluationCycleName: string;
}

interface EvaluatorSelection {
  relationType: EvaluationRelationType;
  evaluators: string[];
  weight: number;
}

interface EmployeeWeightAssignment {
  evaluateeUserId: string;
  selections: EvaluatorSelection[];
}

export default function AssignEvaluatorsDialog({
  open,
  onOpenChange,
  evaluationCycleId,
  evaluationCycleName,
}: AssignEvaluatorsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [assignments, setAssignments] = useState<Record<string, EmployeeWeightAssignment>>({});
  const [saving, setSaving] = useState(false);

  // Get all employees
  const { data: employeesData, loading: employeesLoading } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000, search: searchQuery },
    fetchPolicy: 'cache-and-network',
  });

  // Get existing assessments
  const { data: existingAssessmentsData } = useQuery(GET_COMPETENCY_ASSESSMENTS, {
    variables: { page: 1, limit: 10000, evaluationCycleId },
    fetchPolicy: 'network-only',
  });

  // Get evaluator candidates for selected employee
  const { data: candidatesData } = useQuery(GET_EVALUATOR_CANDIDATES, {
    variables: { evaluateeUserId: selectedEmployeeId },
    skip: !selectedEmployeeId,
  });

  // Get default weights for selected employee
  const { data: defaultWeightsData } = useQuery(GET_DEFAULT_WEIGHTS, {
    variables: { evaluateeUserId: selectedEmployeeId },
    skip: !selectedEmployeeId,
  });

  // Bulk assign mutation
  const [bulkAssignEvaluators] = useMutation(BULK_ASSIGN_EVALUATORS, {
    refetchQueries: [{ query: GET_COMPETENCY_ASSESSMENTS, variables: { page: 1, limit: 10000, evaluationCycleId } }],
  });

  const employees = employeesData?.employees?.items || [];
  const selectedEmployee = employees.find((e: any) => e.employeeId === selectedEmployeeId);
  const candidates = candidatesData?.getEvaluatorCandidates;
  const defaultWeights = defaultWeightsData?.getDefaultWeights;
  const existingAssessments = existingAssessmentsData?.competencyAssessments?.items || [];

  // Check if assessment exists
  const assessmentExists = (evaluateeId: string, evaluatorId: string, relationType: string) => {
    return existingAssessments.some((a: any) => 
      a.evaluatee.employeeId === evaluateeId &&
      a.evaluator.employeeId === evaluatorId &&
      a.relationType === relationType
    );
  };

  // Initialize assignments when employee is selected
  useEffect(() => {
    if (selectedEmployeeId && candidates && defaultWeights && !assignments[selectedEmployeeId]) {
      const selections: EvaluatorSelection[] = [];

      // Only add categories that have eligible evaluators and don't already exist
      candidates.candidates.forEach((category: any) => {
        if (category.applicable && category.count > 0) {
          const existingCount = category.employees.filter((emp: any) =>
            !assessmentExists(selectedEmployeeId, emp.employeeId, category.relationType)
          ).length;

          if (existingCount > 0) {
            selections.push({
              relationType: category.relationType,
              evaluators: category.employees
                .filter((emp: any) =>
                  !assessmentExists(selectedEmployeeId, emp.employeeId, category.relationType)
                )
                .map((emp: any) => emp.employeeId),
              weight: defaultWeights[category.relationType] || 0,
            });
          }
        }
      });

      setAssignments(prev => ({
        ...prev,
        [selectedEmployeeId]: {
          evaluateeUserId: selectedEmployeeId,
          selections,
        },
      }));
    }
  }, [selectedEmployeeId, candidates, defaultWeights, assignments, existingAssessments]);

  // Handle weight change with validation
  const handleWeightChange = (relationType: EvaluationRelationType, newWeight: number) => {
    if (!selectedEmployeeId) return;

    setAssignments(prev => {
      const assignment = prev[selectedEmployeeId];
      if (!assignment) return prev;

      const updatedSelections = assignment.selections.map(sel => 
        sel.relationType === relationType 
          ? { ...sel, weight: Math.min(100, Math.max(0, newWeight)) }
          : sel
      );

      return {
        ...prev,
        [selectedEmployeeId]: {
          ...assignment,
          selections: updatedSelections,
        },
      };
    });
  };

  // Handle evaluator selection toggle
  const handleEvaluatorToggle = (relationType: EvaluationRelationType, evaluatorId: string, isSelected: boolean) => {
    if (!selectedEmployeeId) return;

    setAssignments(prev => {
      const assignment = prev[selectedEmployeeId];
      if (!assignment) return prev;

      const updatedSelections = assignment.selections.map(sel => {
        if (sel.relationType !== relationType) return sel;
        
        if (isSelected) {
          return { ...sel, evaluators: [...sel.evaluators, evaluatorId] };
        } else {
          return { ...sel, evaluators: sel.evaluators.filter(id => id !== evaluatorId) };
        }
      });

      return {
        ...prev,
        [selectedEmployeeId]: {
          ...assignment,
          selections: updatedSelections,
        },
      };
    });
  };

  // Calculate total weight
  const getTotalWeight = (evaluateeId: string) => {
    const assignment = assignments[evaluateeId];
    if (!assignment) return 0;
    return assignment.selections.reduce((sum, sel) => sum + sel.weight, 0);
  };

  // Check if weights are valid (must equal 100%)
  const isWeightValid = (evaluateeId: string) => {
    const total = getTotalWeight(evaluateeId);
    return Math.abs(total - 100) < 0.01; // Allow for floating point errors
  };

  const handleBulkAssign = async () => {
    setSaving(true);

    try {
      // Validate all assignments
      for (const [evaluateeId, assignment] of Object.entries(assignments)) {
        if (!isWeightValid(evaluateeId)) {
          toast.error(`Weights for ${assignment.evaluateeUserId} must total 100%`);
          setSaving(false);
          return;
        }
      }

      // Build bulk assign input
      const bulkAssignments = Object.values(assignments).map((assignment) => ({
        evaluateeUserId: assignment.evaluateeUserId,
        evaluators: assignment.selections.flatMap((sel) =>
          sel.evaluators.map((evaluatorId) => ({
            evaluatorUserId: evaluatorId,
            relationType: sel.relationType,
            weight: sel.weight,
          }))
        ),
      }));

      const result = await bulkAssignEvaluators({
        variables: {
          bulkAssignEvaluatorsInput: {
            evaluationCycleId,
            assignments: bulkAssignments,
          },
        },
      });

      if (result.data?.bulkAssignEvaluators?.success) {
        toast.success(
          `Successfully assigned ${result.data.bulkAssignEvaluators.totalCreated} evaluators`
        );
        onOpenChange(false);
        setStep('select');
        setSelectedEmployeeId(null);
        setAssignments({});
      } else {
        const errors = result.data?.bulkAssignEvaluators?.errors || [];
        toast.error(`Failed with ${errors.length} errors`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign evaluators');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Evaluators - {evaluationCycleName}</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Configure who evaluates whom with weight distribution
          </p>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Ready to Configure</p>
                <p className="text-2xl font-bold text-green-600">{employees.filter((e: any) => assignments[e.employeeId]?.selections.length > 0).length}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Valid Weights</p>
                <p className="text-2xl font-bold text-purple-600">
                  {employees.filter((e: any) => isWeightValid(e.employeeId)).length}
                </p>
              </div>
            </div>

            <ScrollArea className="h-[350px] border rounded-lg p-4">
              <div className="space-y-3">
                {employeesLoading ? (
                  <p className="text-center text-gray-500">Loading employees...</p>
                ) : (
                  employees.map((employee: any) => {
                    const assignment = assignments[employee.employeeId];
                    const hasAssignment = assignment && assignment.selections.length > 0;
                    const weightValid = hasAssignment && isWeightValid(employee.employeeId);

                    return (
                      <div
                        key={employee.employeeId}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedEmployeeId(employee.employeeId);
                          setStep('configure');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{employee.fullName}</p>
                            <p className="text-xs text-gray-500">{employee.email}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            {hasAssignment && (
                              <Badge
                                variant={weightValid ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {getTotalWeight(employee.employeeId).toFixed(1)}%
                              </Badge>
                            )}
                            {hasAssignment && weightValid ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : hasAssignment ? (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === 'configure' && selectedEmployee && candidates && defaultWeights && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Button variant="ghost" size="sm" onClick={() => {
                setStep('select');
                setSelectedEmployeeId(null);
              }}>
                ← Back to List
              </Button>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{selectedEmployee.fullName}</p>
                <p className="text-sm text-gray-600">{selectedEmployee.email}</p>
              </div>
              <Badge variant={isWeightValid(selectedEmployeeId) ? 'default' : 'destructive'}>
                Total: {getTotalWeight(selectedEmployeeId).toFixed(1)}%
              </Badge>
            </div>

            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-6">
                {candidates.candidates
                  .filter((cat: any) => cat.applicable && cat.count > 0)
                  .map((category: any) => {
                    const assignment = assignments[selectedEmployeeId];
                    const selection = assignment?.selections.find(
                      (sel) => sel.relationType === category.relationType
                    );

                    if (!selection) return null;

                    return (
                      <div key={category.relationType} className="p-4 border rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 capitalize">
                                {category.relationType.toLowerCase()} Evaluation
                              </h3>
                              <p className="text-xs text-gray-600">
                                {category.count} eligible {category.count === 1 ? 'person' : 'people'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-indigo-600">
                                {selection.weight.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <div>
                            <Slider
                              value={[selection.weight]}
                              min={0}
                              max={100}
                              step={0.1}
                              onValueChange={(value) =>
                                handleWeightChange(category.relationType, value[0])
                              }
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">Adjust weight for this category</p>
                          </div>

                          <div className="space-y-2">
                            {category.employees
                              .filter((emp: any) =>
                                !assessmentExists(selectedEmployeeId, emp.employeeId, category.relationType)
                              )
                              .map((evaluator: any) => (
                                <div
                                  key={evaluator.employeeId}
                                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                                >
                                  <Checkbox
                                    checked={selection.evaluators.includes(evaluator.employeeId)}
                                    onCheckedChange={(isChecked) =>
                                      handleEvaluatorToggle(
                                        category.relationType,
                                        evaluator.employeeId,
                                        !!isChecked
                                      )
                                    }
                                  />
                                  <label className="flex-1 text-sm font-medium cursor-pointer">
                                    {evaluator.fullName}
                                  </label>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                Weight validation: Weights must total exactly 100%. Current: <span className="font-bold">{getTotalWeight(selectedEmployeeId).toFixed(1)}%</span>
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step === 'select' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkAssign}
                disabled={
                  saving ||
                  !employees.some((e: any) => isWeightValid(e.employeeId)) ||
                  employees.filter((e: any) => isWeightValid(e.employeeId)).length === 0
                }
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? 'Assigning...' : 'Assign All'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('select')}
              >
                Back to List
              </Button>
              <Button
                onClick={() => handleBulkAssign()}
                disabled={!isWeightValid(selectedEmployeeId) || saving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? 'Assigning...' : 'Assign for This Employee'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
