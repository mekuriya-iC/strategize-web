"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { CREATE_COMPETENCY_ASSESSMENT } from "@/lib/graphql/mutations/evaluations";
import {
  GET_COMPETENCY_ASSESSMENTS,
  GET_COMPETENCY_ASSESSMENT_EVALUATOR_OPTIONS,
} from "@/lib/graphql/queries/evaluations";
import { EvaluationRelationType } from "@/types/evaluation";
import { toast } from "sonner";

interface AssignEvaluatorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationCycleId: string;
  evaluationCycleName: string;
  totalEvaluationWeight: number; // Add this prop
}

interface EmployeeAssignment {
  employee: any;
  assignSelf: boolean;
  selfWeight: number;
  // If true, we assign exactly one supervisor evaluator (supervisorEvaluatorId)
  assignSupervisor: boolean;
  supervisorEvaluatorId?: string | null;
  supervisorWeight: number;
  peers: string[];
  peerWeight: number;
  subordinates: string[];
  subordinateWeight: number;
}

export default function AssignEvaluatorsDialog({
  open,
  onOpenChange,
  evaluationCycleId,
  evaluationCycleName,
  totalEvaluationWeight = 25, // Default to 25%
}: AssignEvaluatorsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [assignments, setAssignments] = useState<
    Record<string, EmployeeAssignment>
  >({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"select" | "assign">("select");

  const { data: employeesData, loading: employeesLoading } = useQuery(
    GET_EMPLOYEES,
    {
      variables: { page: 1, limit: 1000, search: searchQuery },
      fetchPolicy: "cache-and-network",
    },
  );

  const [createAssessment] = useMutation(CREATE_COMPETENCY_ASSESSMENT, {
    refetchQueries: [GET_COMPETENCY_ASSESSMENTS],
  });

  const employees = employeesData?.employees?.items || [];
  const selectedEmployee = employees.find(
    (e: any) => e.employeeId === selectedEmployeeId,
  );

  const { data: evaluatorOptionsData } = useQuery(
    GET_COMPETENCY_ASSESSMENT_EVALUATOR_OPTIONS,
    {
      variables: { evaluateeUserId: selectedEmployeeId },
      skip: !selectedEmployeeId,
      fetchPolicy: "cache-and-network",
    },
  );

  const evaluatorOptions =
    evaluatorOptionsData?.competencyAssessmentEvaluatorOptions;
  const supervisorOptions = evaluatorOptions?.supervisors || [];
  const peerOptions = evaluatorOptions?.peers || [];
  const subordinateOptions = evaluatorOptions?.subordinates || [];

  // Initialize assignments when employees load
  useEffect(() => {
    if (employees.length > 0 && Object.keys(assignments).length === 0) {
      const initialAssignments: Record<string, EmployeeAssignment> = {};
      const defaultWeight = totalEvaluationWeight / 4; // Equal distribution by default
      
      employees.forEach((emp: any) => {
        initialAssignments[emp.employeeId] = {
          employee: emp,
          assignSelf: true,
          selfWeight: defaultWeight,
          assignSupervisor: false,
          supervisorEvaluatorId: null,
          supervisorWeight: defaultWeight,
          peers: [],
          peerWeight: defaultWeight,
          subordinates: [],
          subordinateWeight: defaultWeight,
        };
      });
      setAssignments(initialAssignments);
    }
  }, [employees, assignments, totalEvaluationWeight]);

  const handleToggleSelf = (employeeId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        assignSelf: !prev[employeeId].assignSelf,
      },
    }));
  };

  const handleToggleSupervisor = (
    employeeId: string,
    defaultSupervisorId?: string | null,
  ) => {
    setAssignments((prev) => {
      const next = !prev[employeeId].assignSupervisor;
      return {
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          assignSupervisor: next,
          supervisorEvaluatorId: next
            ? (prev[employeeId].supervisorEvaluatorId ??
              defaultSupervisorId ??
              null)
            : null,
        },
      };
    });
  };

  const handleSupervisorSelect = (employeeId: string, supervisorId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        supervisorEvaluatorId: supervisorId,
        assignSupervisor: true,
      },
    }));
  };

  const handleTogglePeer = (evaluateeId: string, peerId: string) => {
    setAssignments((prev) => {
      const currentPeers = prev[evaluateeId]?.peers || [];
      const newPeers = currentPeers.includes(peerId)
        ? currentPeers.filter((id) => id !== peerId)
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

  const handleToggleSubordinate = (
    evaluateeId: string,
    subordinateId: string,
  ) => {
    setAssignments((prev) => {
      const currentSubordinates = prev[evaluateeId]?.subordinates || [];
      const newSubordinates = currentSubordinates.includes(subordinateId)
        ? currentSubordinates.filter((id) => id !== subordinateId)
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

  // Weight setters
  const handleSetSelfWeight = (employeeId: string, weight: number) => {
    setAssignments((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        selfWeight: weight,
      },
    }));
  };

  const handleSetSupervisorWeight = (employeeId: string, weight: number) => {
    setAssignments((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        supervisorWeight: weight,
      },
    }));
  };

  const handleSetPeerWeight = (employeeId: string, weight: number) => {
    setAssignments((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        peerWeight: weight,
      },
    }));
  };

  const handleSetSubordinateWeight = (employeeId: string, weight: number) => {
    setAssignments((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        subordinateWeight: weight,
      },
    }));
  };

  // Weight calculation helpers
  const getEmployeeWeightSum = (employeeId: string): number => {
    const assignment = assignments[employeeId];
    if (!assignment) return 0;

    let sum = 0;
    if (assignment.assignSelf) sum += assignment.selfWeight;
    if (assignment.assignSupervisor && assignment.supervisorEvaluatorId) {
      sum += assignment.supervisorWeight;
    }
    if (assignment.peers.length > 0) sum += assignment.peerWeight;
    if (assignment.subordinates.length > 0) sum += assignment.subordinateWeight;

    return Math.round(sum * 100) / 100;
  };

  const isWeightValid = (employeeId: string): boolean => {
    const sum = getEmployeeWeightSum(employeeId);
    return Math.abs(sum - totalEvaluationWeight) < 0.01;
  };

  const handleBulkAssign = async (evaluateeId?: string) => {
    setSaving(true);
    
    // Validate weights before sending
    if (evaluateeId && !isWeightValid(evaluateeId)) {
      toast.error(`Weight sum must equal ${totalEvaluationWeight}%`);
      setSaving(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    const targetAssignments = evaluateeId
      ? { [evaluateeId]: assignments[evaluateeId] }
      : assignments;

    try {
      for (const [id, assignment] of Object.entries(targetAssignments)) {
        if (!assignment) continue;

        // Validate weight for each employee
        if (!isWeightValid(id)) {
          toast.error(`${assignment.employee.fullName}: Weight sum must equal ${totalEvaluationWeight}%`);
          errorCount++;
          continue;
        }

        const assessmentsToCreate: Array<{
          evaluatorUserId: string;
          relationType: EvaluationRelationType;
          weightPercent: number;
        }> = [];

        // Self assessment
        if (assignment.assignSelf) {
          assessmentsToCreate.push({
            evaluatorUserId: id,
            relationType: EvaluationRelationType.SELF,
            weightPercent: assignment.selfWeight,
          });
        }

        // Supervisor assessment
        if (assignment.assignSupervisor && assignment.supervisorEvaluatorId) {
          assessmentsToCreate.push({
            evaluatorUserId: assignment.supervisorEvaluatorId,
            relationType: EvaluationRelationType.SUPERVISOR,
            weightPercent: assignment.supervisorWeight,
          });
        }

        // Peer assessments
        if (assignment.peers.length > 0) {
          for (const peerId of assignment.peers) {
            assessmentsToCreate.push({
              evaluatorUserId: peerId,
              relationType: EvaluationRelationType.PEER,
              weightPercent: assignment.peerWeight,
            });
          }
        }

        // Subordinate assessments
        if (assignment.subordinates.length > 0) {
          for (const subordinateId of assignment.subordinates) {
            assessmentsToCreate.push({
              evaluatorUserId: subordinateId,
              relationType: EvaluationRelationType.SUBORDINATE,
              weightPercent: assignment.subordinateWeight,
            });
          }
        }

        // Create all assessments for this employee
        for (const assessment of assessmentsToCreate) {
          try {
            await createAssessment({
              variables: {
                createCompetencyAssessmentInput: {
                  evaluateeUserId: id,
                  evaluatorUserId: assessment.evaluatorUserId,
                  evaluationCycleId,
                  relationType: assessment.relationType,
                  weightPercent: assessment.weightPercent,
                },
              },
            });
            successCount++;
          } catch (error: any) {
            console.error(
              `Failed to create assessment for ${id}:`,
              error,
            );
            errorCount++;
          }
        }
      }

      if (errorCount === 0) {
        toast.success(`Successfully assigned evaluators with weights`);
        if (evaluateeId) {
          setStep("select");
          setSelectedEmployeeId(null);
        } else {
          onOpenChange(false);
        }
      } else {
        toast.warning(
          `Created ${successCount} assessments, ${errorCount} failed`,
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to assign evaluators");
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

  const getEmployeeAssignmentCount = (employeeId: string) => {
    const assignment = assignments[employeeId];
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
            <span className="font-medium text-indigo-600">
              {" "}(Total Weight: {totalEvaluationWeight}%)
            </span>
          </p>
        </DialogHeader>

        {step === "select" && (
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
                <p className="text-2xl font-bold text-indigo-600">
                  {employees.length}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-green-600">
                  {getTotalAssignments()}
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg per Employee</p>
                <p className="text-2xl font-bold text-amber-600">
                  {employees.length > 0
                    ? (getTotalAssignments() / employees.length).toFixed(1)
                    : 0}
                </p>
              </div>
            </div>

            {/* Employee List */}
            <ScrollArea className="h-[400px] border rounded-lg">
              {employeesLoading ? (
                <div
                  key="loading"
                  className="flex items-center justify-center h-full"
                >
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Loading employees...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {employees.map((employee: any) => {
                    const assignmentCount = getEmployeeAssignmentCount(
                      employee.employeeId,
                    );

                    return (
                      <div
                        key={employee.employeeId}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() => {
                          setSelectedEmployeeId(employee.employeeId);
                          setStep("assign");
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                              <span className="text-sm font-semibold text-indigo-600">
                                {employee.fullName?.charAt(0) || "U"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {employee.fullName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {employee.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" />
                                {assignmentCount} evaluators
                              </Badge>
                              {assignmentCount > 0 ? (
                                <span className="text-[10px] text-green-600 font-medium">
                                  Configured
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  Not configured
                                </span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              Configure →
                            </Button>
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

        {step === "assign" && selectedEmployee && (
          <div className="space-y-4">
            {/* Back button and employee info */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("select")}
              >
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-indigo-600">
                    {selectedEmployee.fullName?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedEmployee.fullName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedEmployee.email}
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-6 pr-4">
                {/* Self Assessment */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Self Assessment
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id={`self-${selectedEmployeeId}`}
                      checked={
                        selectedEmployeeId
                          ? assignments[selectedEmployeeId]?.assignSelf || false
                          : false
                      }
                      onCheckedChange={() =>
                        selectedEmployeeId &&
                        handleToggleSelf(selectedEmployeeId)
                      }
                    />
                    <label
                      htmlFor={`self-${selectedEmployeeId}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      Assign self-assessment
                    </label>
                    {selectedEmployeeId && assignments[selectedEmployeeId]?.assignSelf && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={assignments[selectedEmployeeId]?.selfWeight || 0}
                          onChange={(e) =>
                            handleSetSelfWeight(
                              selectedEmployeeId,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 text-center"
                          min="0"
                          max={totalEvaluationWeight}
                          step="0.01"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supervisor Assessment */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Supervisor Assessment
                  </Label>

                  {supervisorOptions.length === 0 ? (
                    <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                      No supervisor found for this employee in the org chart.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Checkbox
                          id={`sup-${selectedEmployeeId}`}
                          checked={
                            selectedEmployeeId
                              ? assignments[selectedEmployeeId]
                                  ?.assignSupervisor || false
                              : false
                          }
                          onCheckedChange={() =>
                            selectedEmployeeId &&
                            handleToggleSupervisor(
                              selectedEmployeeId,
                              supervisorOptions[0]?.employeeId ?? null,
                            )
                          }
                        />
                        <label
                          htmlFor={`sup-${selectedEmployeeId}`}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                        >
                          Assign supervisor assessment
                        </label>
                        {selectedEmployeeId && assignments[selectedEmployeeId]?.assignSupervisor && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={assignments[selectedEmployeeId]?.supervisorWeight || 0}
                              onChange={(e) =>
                                handleSetSupervisorWeight(
                                  selectedEmployeeId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 text-center"
                              min="0"
                              max={totalEvaluationWeight}
                              step="0.01"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                        )}
                      </div>

                      {selectedEmployeeId &&
                        assignments[selectedEmployeeId]?.assignSupervisor && (
                          <div className="p-3 bg-white border rounded-lg">
                            <p className="text-xs text-gray-500 mb-2">
                              Supervisor
                            </p>
                            <div className="space-y-2">
                              {supervisorOptions.map((sup: any) => (
                                <div
                                  key={sup.employeeId}
                                  className="flex items-center gap-2"
                                >
                                  <Checkbox
                                    id={`sup-choice-${sup.employeeId}`}
                                    checked={
                                      assignments[selectedEmployeeId]
                                        ?.supervisorEvaluatorId ===
                                      sup.employeeId
                                    }
                                    onCheckedChange={() =>
                                      handleSupervisorSelect(
                                        selectedEmployeeId,
                                        sup.employeeId,
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`sup-choice-${sup.employeeId}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {sup.fullName}
                                    <span className="text-xs text-gray-500">
                                      {" "}
                                      · {sup.title}
                                    </span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Peer Assessments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Peer Assessments
                    </Label>
                    {selectedEmployeeId && assignments[selectedEmployeeId]?.peers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={assignments[selectedEmployeeId]?.peerWeight || 0}
                          onChange={(e) =>
                            handleSetPeerWeight(
                              selectedEmployeeId,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 text-center"
                          min="0"
                          max={totalEvaluationWeight}
                          step="0.01"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    )}
                  </div>

                  {peerOptions.length === 0 ? (
                    <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                      No eligible peers found for this employee.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {peerOptions.map((peer: any) => (
                        <div
                          key={peer.employeeId}
                          className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                        >
                          <Checkbox
                            id={`peer-${peer.employeeId}`}
                            checked={
                              selectedEmployeeId
                                ? assignments[
                                    selectedEmployeeId
                                  ]?.peers?.includes(peer.employeeId) || false
                                : false
                            }
                            onCheckedChange={() =>
                              selectedEmployeeId &&
                              handleTogglePeer(
                                selectedEmployeeId,
                                peer.employeeId,
                              )
                            }
                          />
                          <label
                            htmlFor={`peer-${peer.employeeId}`}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {peer.fullName}
                            <span className="text-xs text-gray-500">
                              {" "}
                              · {peer.title}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subordinate Assessments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">
                        Subordinate Assessments (360°)
                      </Label>
                      <p className="text-xs text-gray-500">
                        Select direct reports to provide upward feedback
                      </p>
                    </div>
                    {selectedEmployeeId && assignments[selectedEmployeeId]?.subordinates.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={assignments[selectedEmployeeId]?.subordinateWeight || 0}
                          onChange={(e) =>
                            handleSetSubordinateWeight(
                              selectedEmployeeId,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 text-center"
                          min="0"
                          max={totalEvaluationWeight}
                          step="0.01"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    )}
                  </div>

                  {subordinateOptions.length === 0 ? (
                    <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                      No subordinates found for this employee.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {subordinateOptions.map((sub: any) => (
                        <div
                          key={sub.employeeId}
                          className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                        >
                          <Checkbox
                            id={`sub-${sub.employeeId}`}
                            checked={
                              selectedEmployeeId
                                ? assignments[
                                    selectedEmployeeId
                                  ]?.subordinates?.includes(sub.employeeId) ||
                                  false
                                : false
                            }
                            onCheckedChange={() =>
                              selectedEmployeeId &&
                              handleToggleSubordinate(
                                selectedEmployeeId,
                                sub.employeeId,
                              )
                            }
                          />
                          <label
                            htmlFor={`sub-${sub.employeeId}`}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {sub.fullName}
                            <span className="text-xs text-gray-500">
                              {" "}
                              · {sub.title}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weight Summary */}
                {selectedEmployeeId && (
                  <div className="mt-6 p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Total Weight</span>
                      <span
                        className={`text-2xl font-bold ${
                          isWeightValid(selectedEmployeeId)
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {getEmployeeWeightSum(selectedEmployeeId)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Required:</span>
                      <span className="font-medium">{totalEvaluationWeight}%</span>
                    </div>
                    {!isWeightValid(selectedEmployeeId) && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Weight sum must equal {totalEvaluationWeight}%
                      </p>
                    )}
                    {isWeightValid(selectedEmployeeId) && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Weight configuration is valid
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {step === "select" ? (
            <div className="flex w-full justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-between items-center">
              <div className="text-sm">
                <p className="text-gray-500">
                  {getEmployeeAssignmentCount(selectedEmployeeId || "")} evaluators selected
                </p>
                {selectedEmployeeId && (
                  <p className={`font-medium ${
                    isWeightValid(selectedEmployeeId) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Weight: {getEmployeeWeightSum(selectedEmployeeId)}% / {totalEvaluationWeight}%
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("select")}>
                  Back
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={saving || (selectedEmployeeId ? !isWeightValid(selectedEmployeeId) : false)}
                  onClick={() => handleBulkAssign(selectedEmployeeId || "")}
                >
                  {saving ? "Saving..." : "Save & Confirm"}
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
