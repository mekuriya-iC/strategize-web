'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_EMPLOYEES } from '@/lib/graphql/queries/employees';
import { CREATE_COMPETENCY_ASSESSMENT } from '@/lib/graphql/mutations/evaluations';
import { GET_COMPETENCY_ASSESSMENTS } from '@/lib/graphql/queries/evaluations';
import { EvaluationRelationType } from '@/types/evaluation';
import { toast } from 'sonner';

interface AssignEvaluatorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationCycleId: string;
  evaluationCycleName: string;
}

interface EmployeeAssignment {
  employee: any;
  assignSelf: boolean;
  assignSupervisor: boolean;
  peers: string[];
  subordinates: string[];
}

export default function AssignEvaluatorsDialog({
  open,
  onOpenChange,
  evaluationCycleId,
  evaluationCycleName,
}: AssignEvaluatorsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, EmployeeAssignment>>({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'select' | 'assign'>('select');

  const { data: employeesData, loading: employeesLoading } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000, search: searchQuery },
    fetchPolicy: 'cache-and-network',
  });

  const [createAssessment] = useMutation(CREATE_COMPETENCY_ASSESSMENT, {
    refetchQueries: [GET_COMPETENCY_ASSESSMENTS],
  });

  const employees = employeesData?.employees?.items || [];
  const selectedEmployee = employees.find((e: any) => e.userId === selectedEmployeeId);

  // Initialize assignments when employees load
  useEffect(() => {
    if (employees.length > 0 && Object.keys(assignments).length === 0) {
      const initialAssignments: Record<string, EmployeeAssignment> = {};
      employees.forEach((emp: any) => {
        initialAssignments[emp.userId] = {
          employee: emp,
          assignSelf: true, // Default: everyone does self-assessment
          assignSupervisor: !!emp.supervisor, // Assign supervisor if exists
          peers: [],
          subordinates: [],
        };
      });
      setAssignments(initialAssignments);
    }
  }, [employees, assignments]);

  const handleToggleSelf = (userId: string) => {
    setAssignments(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        assignSelf: !prev[userId].assignSelf,
      },
    }));
  };

  const handleToggleSupervisor = (userId: string) => {
    setAssignments(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        assignSupervisor: !prev[userId].assignSupervisor,
      },
    }));
  };

  const handleTogglePeer = (evaluateeId: string, peerId: string) => {
    setAssignments(prev => {
      const currentPeers = prev[evaluateeId]?.peers || [];
      const newPeers = currentPeers.includes(peerId)
        ? currentPeers.filter(id => id !== peerId)
        : [...currentPeers, peerId];
      
      return {
        ...prev,
        [evaluateeId]: {
          ...prev[evaluateeId],
          peers: newPeers,
        },
      };
    });
  };

  const handleToggleSubordinate = (evaluateeId: string, subordinateId: string) => {
    setAssignments(prev => {
      const currentSubordinates = prev[evaluateeId]?.subordinates || [];
      const newSubordinates = currentSubordinates.includes(subordinateId)
        ? currentSubordinates.filter(id => id !== subordinateId)
        : [...currentSubordinates, subordinateId];
      
      return {
        ...prev,
        [evaluateeId]: {
          ...prev[evaluateeId],
          subordinates: newSubordinates,
        },
      };
    });
  };

  const handleBulkAssign = async () => {
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const [evaluateeId, assignment] of Object.entries(assignments)) {
        const assessmentsToCreate: Array<{
          evaluatorId: string;
          relationType: EvaluationRelationType;
        }> = [];

        // Self assessment
        if (assignment.assignSelf) {
          assessmentsToCreate.push({
            evaluatorId: evaluateeId,
            relationType: EvaluationRelationType.SELF,
          });
        }

        // Supervisor assessment
        if (assignment.assignSupervisor && assignment.employee.supervisor) {
          assessmentsToCreate.push({
            evaluatorId: assignment.employee.supervisor.userId,
            relationType: EvaluationRelationType.SUPERVISOR,
          });
        }

        // Peer assessments
        assignment.peers.forEach(peerId => {
          assessmentsToCreate.push({
            evaluatorId: peerId,
            relationType: EvaluationRelationType.PEER,
          });
        });

        // Subordinate assessments
        assignment.subordinates.forEach(subordinateId => {
          assessmentsToCreate.push({
            evaluatorId: subordinateId,
            relationType: EvaluationRelationType.SUBORDINATE,
          });
        });

        // Create all assessments for this employee
        for (const assessment of assessmentsToCreate) {
          try {
            await createAssessment({
              variables: {
                createCompetencyAssessmentInput: {
                  evaluateeUserId: evaluateeId,
                  evaluatorUserId: assessment.evaluatorId,
                  evaluationCycleId,
                  relationType: assessment.relationType,
                },
              },
            });
            successCount++;
          } catch (error: any) {
            console.error(`Failed to create assessment for ${evaluateeId}:`, error);
            errorCount++;
          }
        }
      }

      if (errorCount === 0) {
        toast.success(`Successfully created ${successCount} assessments`);
        onOpenChange(false);
        setStep('select');
        setSelectedEmployeeId(null);
      } else {
        toast.warning(`Created ${successCount} assessments, ${errorCount} failed`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign evaluators');
    } finally {
      setSaving(false);
    }
  };

  const getTotalAssignments = () => {
    return Object.values(assignments).reduce((total, assignment) => {
      let count = 0;
      if (assignment.assignSelf) count++;
      if (assignment.assignSupervisor) count++;
      count += assignment.peers.length;
      count += assignment.subordinates.length;
      return total + count;
    }, 0);
  };

  const getEmployeeAssignmentCount = (userId: string) => {
    const assignment = assignments[userId];
    if (!assignment) return 0;
    
    let count = 0;
    if (assignment.assignSelf) count++;
    if (assignment.assignSupervisor) count++;
    count += assignment.peers.length;
    count += assignment.subordinates.length;
    return count;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assign Evaluators - {evaluationCycleName}</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Configure who evaluates whom for this evaluation cycle
          </p>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4">
            {/* Search */}
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

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-indigo-600">{employees.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-green-600">{getTotalAssignments()}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg per Employee</p>
                <p className="text-2xl font-bold text-amber-600">
                  {employees.length > 0 ? (getTotalAssignments() / employees.length).toFixed(1) : 0}
                </p>
              </div>
            </div>

            {/* Employee List */}
            <ScrollArea className="h-[400px] border rounded-lg">
              {employeesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading employees...</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {employees.map((employee: any) => {
                    const assignmentCount = getEmployeeAssignmentCount(employee.userId);
                    
                    return (
                      <div
                        key={employee.userId}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedEmployeeId(employee.userId);
                          setStep('assign');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-indigo-600">
                                {employee.fullName?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{employee.fullName}</p>
                              <p className="text-sm text-gray-600">{employee.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="gap-1">
                              <Users className="h-3 w-3" />
                              {assignmentCount} evaluators
                            </Badge>
                            {assignmentCount > 0 ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {step === 'assign' && selectedEmployee && (
          <div className="space-y-4">
            {/* Back button and employee info */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Button variant="ghost" size="sm" onClick={() => setStep('select')}>
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-indigo-600">
                    {selectedEmployee.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedEmployee.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedEmployee.email}</p>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-6 pr-4">
                {/* Self Assessment */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Self Assessment</Label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id={`self-${selectedEmployeeId}`}
                      checked={selectedEmployeeId ? (assignments[selectedEmployeeId]?.assignSelf || false) : false}
                      onCheckedChange={() => selectedEmployeeId && handleToggleSelf(selectedEmployeeId)}
                    />
                    <label
                      htmlFor={`self-${selectedEmployeeId}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Assign self-assessment
                    </label>
                  </div>
                </div>

                {/* Supervisor Assessment */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Supervisor Assessment</Label>
                  {selectedEmployee.supervisor ? (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id={`supervisor-${selectedEmployeeId}`}
                        checked={selectedEmployeeId ? (assignments[selectedEmployeeId]?.assignSupervisor || false) : false}
                        onCheckedChange={() => selectedEmployeeId && handleToggleSupervisor(selectedEmployeeId)}
                      />
                      <label
                        htmlFor={`supervisor-${selectedEmployeeId}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {selectedEmployee.supervisor.fullName}
                      </label>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                      No supervisor assigned
                    </p>
                  )}
                </div>

                {/* Peer Assessments */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Peer Assessments</Label>
                  <div className="space-y-2">
                    {employees
                      .filter((e: any) => e.userId !== selectedEmployeeId)
                      .map((peer: any) => (
                        <div key={peer.userId} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <Checkbox
                            id={`peer-${peer.userId}`}
                            checked={selectedEmployeeId ? (assignments[selectedEmployeeId]?.peers?.includes(peer.userId) || false) : false}
                            onCheckedChange={() => selectedEmployeeId && handleTogglePeer(selectedEmployeeId, peer.userId)}
                          />
                          <label
                            htmlFor={`peer-${peer.userId}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {peer.fullName}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Subordinate Assessments */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Subordinate Assessments (360°)</Label>
                  <p className="text-xs text-gray-500">Select direct reports to provide upward feedback</p>
                  <div className="space-y-2">
                    {employees
                      .filter((e: any) => e.supervisor?.userId === selectedEmployeeId)
                      .map((subordinate: any) => (
                        <div key={subordinate.userId} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <Checkbox
                            id={`subordinate-${subordinate.userId}`}
                            checked={selectedEmployeeId ? (assignments[selectedEmployeeId]?.subordinates?.includes(subordinate.userId) || false) : false}
                            onCheckedChange={() => selectedEmployeeId && handleToggleSubordinate(selectedEmployeeId, subordinate.userId)}
                          />
                          <label
                            htmlFor={`subordinate-${subordinate.userId}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {subordinate.fullName}
                          </label>
                        </div>
                      ))}
                    {employees.filter((e: any) => e.supervisor?.userId === selectedEmployeeId).length === 0 && (
                      <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                        No direct reports
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {step === 'select' ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAssign}
                disabled={saving || getTotalAssignments() === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? 'Assigning...' : `Assign ${getTotalAssignments()} Evaluators`}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setStep('select')}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
