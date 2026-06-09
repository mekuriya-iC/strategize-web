"use client";

import { useState } from "react";
import { getOrganizationId } from "@/lib/constants/organization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit2, Trash2, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEvaluationCycles } from "@/hooks/evaluations/useEvaluationCycles";
import {
  useCoreCompetencies,
  useCompetencies,
  useCompetencyMutations,
  useCompetencyIndicators,
} from "@/hooks/competencies/useCompetencies";
import { useEvaluationWeightMutations } from "@/hooks/evaluations/useEvaluationWeights";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import {
  EvaluationCycleStatus,
  EvaluationRelationType,
} from "@/types/evaluation";
import CreateEvaluationCycleDialog from "./dialogs/CreateEvaluationCycleDialog";
import CreateCoreCompetencyDialog from "./dialogs/CreateCoreCompetencyDialog";
import CreateCompetencyDialog from "./dialogs/CreateCompetencyDialog";
import CreateIndicatorDialog from "./dialogs/CreateIndicatorDialog";
import EditCoreCompetencyDialog from "./dialogs/EditCoreCompetencyDialog";
import EditCompetencyDialog from "./dialogs/EditCompetencyDialog";
import EditEvaluationCycleDialog from "./dialogs/EditEvaluationCycleDialog";
import EditIndicatorDialog from "./dialogs/EditIndicatorDialog";
import AssignEvaluatorsDialog from "./dialogs/AssignEvaluatorsDialog";
import CompetencyIndicatorsList from "./CompetencyIndicatorsList";
import CycleStatusTabs from "./CycleStatusTabs";
import { toast } from "sonner";

export default function AdminSetup() {
  const { can } = usePermissions();
  const [activeSubTab, setActiveSubTab] = useState("framework");
  const [searchQuery, setSearchQuery] = useState("");

  const canManageFramework = can("evaluations:manage");
  const canAssignEvaluators = can("evaluations:assign");

  // Dialog states
  const [createCycleOpen, setCreateCycleOpen] = useState(false);
  const [createCoreCompetencyOpen, setCreateCoreCompetencyOpen] =
    useState(false);
  const [createCompetencyOpen, setCreateCompetencyOpen] = useState(false);
  const [createIndicatorOpen, setCreateIndicatorOpen] = useState(false);
  const [editCoreCompetencyOpen, setEditCoreCompetencyOpen] = useState(false);
  const [editCompetencyOpen, setEditCompetencyOpen] = useState(false);
  const [editCycleOpen, setEditCycleOpen] = useState(false);
  const [editIndicatorOpen, setEditIndicatorOpen] = useState(false);
  const [assignEvaluatorsOpen, setAssignEvaluatorsOpen] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<any>(null);
  const [selectedCoreCompetency, setSelectedCoreCompetency] =
    useState<any>(null);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [selectedCycleForAssignment, setSelectedCycleForAssignment] =
    useState<any>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [selectedCoreCompetencyId, setSelectedCoreCompetencyId] =
    useState<string>("");

  // Weight configuration state
  const [selectedWeightCycleId, setSelectedWeightCycleId] =
    useState<string>("");
  
  // Individual weight states with enable/disable
  const [selfEnabled, setSelfEnabled] = useState(true);
  const [selfWeight, setSelfWeight] = useState(5);
  const [peerEnabled, setPeerEnabled] = useState(true);
  const [peerWeight, setPeerWeight] = useState(5);
  const [supervisorEnabled, setSupervisorEnabled] = useState(true);
  const [supervisorWeight, setSupervisorWeight] = useState(10);
  const [subordinateEnabled, setSubordinateEnabled] = useState(true);
  const [subordinateWeight, setSubordinateWeight] = useState(5);

  const { cycles, loading: cyclesLoading } = useEvaluationCycles(
    1,
    20,
    "",
    EvaluationCycleStatus.ACTIVE,
  );
  const hasActiveCycle = cycles?.some(
    (cycle: any) => cycle.status === EvaluationCycleStatus.ACTIVE,
  );
  
  // Get the selected cycle to access totalEvaluationWeight (must be after cycles hook)
  const selectedWeightCycle = cycles?.find(
    (c: any) => c.evaluationCycleId === selectedWeightCycleId
  );
  const requiredWeight = selectedWeightCycle?.totalEvaluationWeight || 25;
  
  const organizationId = getOrganizationId();
  const { coreCompetencies, loading: coreLoading } = useCoreCompetencies(
    1,
    50,
    organizationId,
  );
  const { competencies, loading: competenciesLoading } = useCompetencies(
    1,
    100,
    searchQuery,
    organizationId,
  );
  const { removeCompetency, removeIndicator, removeCoreCompetency } =
    useCompetencyMutations(organizationId);
  const { bulkUpdateWeights } = useEvaluationWeightMutations();

  // Group competencies by core competency
  const groupedCompetencies = competencies?.reduce((acc: any, comp: any) => {
    const coreId = comp.coreCompetency?.coreCompetencyId || "uncategorized";
    if (!acc[coreId]) {
      acc[coreId] = {
        core: comp.coreCompetency,
        items: [],
      };
    }
    acc[coreId].items.push(comp);
    return acc;
  }, {});

  // Add core competencies that don't have any competencies yet
  coreCompetencies?.forEach((coreComp: any) => {
    if (!groupedCompetencies[coreComp.coreCompetencyId]) {
      groupedCompetencies[coreComp.coreCompetencyId] = {
        core: coreComp,
        items: [],
      };
    }
  });

  const handleDeleteCompetency = async (
    competencyId: string,
    competencyName: string,
  ) => {
    toast.custom(
      (t) => (
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-semibold">Delete Competency</p>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete "{competencyName}"?
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.dismiss(t)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                toast.dismiss(t);
                try {
                  await removeCompetency(competencyId);
                  toast.success("Competency deleted successfully");
                } catch (error: any) {
                  console.error("❌ [Delete Competency Error]:", error);

                  // Check for foreign key constraint error
                  if (
                    error.message?.includes("foreign key constraint") ||
                    error.message?.includes("FK_")
                  ) {
                    toast.error(
                      "Cannot delete this competency. Please delete all associated indicators first.",
                      { duration: 5000 },
                    );
                  } else {
                    toast.error(error.message || "Failed to delete competency");
                  }
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      },
    );
  };

  const handleDeleteCoreCompetency = async (
    coreCompetencyId: string,
    name: string,
  ) => {
    // Check if this core competency has associated competencies
    const associatedCompetencies =
      competencies?.filter(
        (c: any) => c.coreCompetency?.coreCompetencyId === coreCompetencyId,
      ) || [];

    if (associatedCompetencies.length > 0) {
      toast.error(
        `Cannot delete "${name}" because it has ${associatedCompetencies.length} associated competenc${associatedCompetencies.length === 1 ? "y" : "ies"}. Please delete all competencies first.`,
        {
          duration: 5000,
          position: "top-center",
        },
      );
      return;
    }

    toast.custom(
      (t) => (
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-semibold">Delete Core Competency</p>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete "{name}"?
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.dismiss(t)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                toast.dismiss(t);
                try {
                  await removeCoreCompetency(coreCompetencyId);
                  toast.success("Core competency deleted successfully");
                } catch (error: any) {
                  console.error("❌ [Delete Core Competency Error]:", error);

                  // Check for foreign key constraint error
                  if (
                    error.message?.includes("foreign key constraint") ||
                    error.message?.includes("FK_")
                  ) {
                    toast.error(
                      "Cannot delete this core competency. Please delete all associated competencies first.",
                      { duration: 5000 },
                    );
                  } else {
                    toast.error(
                      error.message || "Failed to delete core competency",
                    );
                  }
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      },
    );
  };

  const handleAddIndicator = (competency: any) => {
    setSelectedCompetency(competency);
    setCreateIndicatorOpen(true);
  };

  const handleAddCompetency = (coreCompetencyId: string) => {
    setSelectedCoreCompetencyId(coreCompetencyId);
    setCreateCompetencyOpen(true);
  };

  const handleEditCoreCompetency = (coreCompetency: any) => {
    setSelectedCoreCompetency(coreCompetency);
    setEditCoreCompetencyOpen(true);
  };

  const handleEditCompetency = (competency: any) => {
    setSelectedCompetency(competency);
    setEditCompetencyOpen(true);
  };

  const handleEditCycle = (cycle: any) => {
    setSelectedCycle(cycle);
    setEditCycleOpen(true);
  };

  const handleEditIndicator = (indicator: any) => {
    setSelectedIndicator(indicator);
    setEditIndicatorOpen(true);
  };

  const handleOpenAssignEvaluators = (cycle: any) => {
    setSelectedCycleForAssignment(cycle);
    setAssignEvaluatorsOpen(true);
  };

  const handleDeleteIndicator = async (
    indicatorId: string,
    description: string,
  ) => {
    toast.custom(
      (t) => (
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-semibold">Delete Indicator</p>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this indicator: "{description}"?
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.dismiss(t)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                toast.dismiss(t);
                try {
                  await removeIndicator(indicatorId);
                  toast.success("Indicator deleted successfully");
                } catch (error: any) {
                  console.error("❌ [Delete Indicator Error]:", error);

                  // Check for foreign key constraint error
                  if (
                    error.message?.includes("foreign key constraint") ||
                    error.message?.includes("FK_") ||
                    error.message?.includes("AssessmentResponse")
                  ) {
                    toast.error(
                      "Cannot delete this indicator. It has been used in evaluations and has assessment responses.",
                      { duration: 5000 },
                    );
                  } else {
                    toast.error(error.message || "Failed to delete indicator");
                  }
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      },
    );
  };

  const handleSaveWeights = async () => {
    if (!selectedWeightCycleId) {
      toast.error("Please select an evaluation cycle");
      return;
    }

    // Calculate total weight from enabled evaluators only
    const enabledWeights = [
      selfEnabled ? selfWeight : 0,
      peerEnabled ? peerWeight : 0,
      supervisorEnabled ? supervisorWeight : 0,
      subordinateEnabled ? subordinateWeight : 0,
    ];
    const totalWeight = enabledWeights.reduce((sum, w) => sum + w, 0);

    if (Math.abs(totalWeight - requiredWeight) > 0.01) {
      toast.error(
        `Total weight must equal ${requiredWeight}% (currently ${totalWeight.toFixed(2)}%)`
      );
      return;
    }

    try {
      await bulkUpdateWeights({
        evaluationCycleId: selectedWeightCycleId,
        weights: [
          {
            relationType: EvaluationRelationType.SELF,
            weightPercent: selfEnabled ? selfWeight : 0,
            isEnabled: selfEnabled,
          },
          {
            relationType: EvaluationRelationType.PEER,
            weightPercent: peerEnabled ? peerWeight : 0,
            isEnabled: peerEnabled,
          },
          {
            relationType: EvaluationRelationType.SUPERVISOR,
            weightPercent: supervisorEnabled ? supervisorWeight : 0,
            isEnabled: supervisorEnabled,
          },
          {
            relationType: EvaluationRelationType.SUBORDINATE,
            weightPercent: subordinateEnabled ? subordinateWeight : 0,
            isEnabled: subordinateEnabled,
          },
        ],
      });
    } catch (error: any) {
      // Error already handled by mutation hook
      console.error("Failed to save weights:", error);
    }
  };

  const totalWeight =
    selfWeight + peerWeight + supervisorWeight + subordinateWeight;

  return (
    <div className="space-y-6">
      {/* Dialogs */}
      <CreateEvaluationCycleDialog
        open={createCycleOpen}
        onOpenChange={setCreateCycleOpen}
        hasActiveCycle={hasActiveCycle}
      />
      <CreateCoreCompetencyDialog
        open={createCoreCompetencyOpen}
        onOpenChange={setCreateCoreCompetencyOpen}
      />
      <CreateCompetencyDialog
        open={createCompetencyOpen}
        onOpenChange={setCreateCompetencyOpen}
        coreCompetencyId={selectedCoreCompetencyId}
      />
      {selectedCompetency && (
        <>
          <CreateIndicatorDialog
            open={createIndicatorOpen}
            onOpenChange={setCreateIndicatorOpen}
            competencyId={selectedCompetency.competencyId}
            competencyName={selectedCompetency.name}
          />
          <EditCompetencyDialog
            open={editCompetencyOpen}
            onOpenChange={setEditCompetencyOpen}
            competency={selectedCompetency}
          />
        </>
      )}
      {selectedCoreCompetency && (
        <EditCoreCompetencyDialog
          open={editCoreCompetencyOpen}
          onOpenChange={setEditCoreCompetencyOpen}
          coreCompetency={selectedCoreCompetency}
        />
      )}
      {selectedCycle && (
        <EditEvaluationCycleDialog
          open={editCycleOpen}
          onOpenChange={setEditCycleOpen}
          cycle={selectedCycle}
        />
      )}
      {selectedIndicator && (
        <EditIndicatorDialog
          open={editIndicatorOpen}
          onOpenChange={setEditIndicatorOpen}
          indicator={selectedIndicator}
        />
      )}
      {selectedCycleForAssignment && (
        <AssignEvaluatorsDialog
          open={assignEvaluatorsOpen}
          onOpenChange={setAssignEvaluatorsOpen}
          evaluationCycleId={selectedCycleForAssignment.evaluationCycleId}
          evaluationCycleName={selectedCycleForAssignment.name}
          totalEvaluationWeight={selectedCycleForAssignment.totalEvaluationWeight || 25}
        />
      )}

      {/* Sub-tabs */}
      <Tabs
        value={activeSubTab}
        onValueChange={setActiveSubTab}
        className="space-y-6"
      >
        <TabsList className="bg-white p-1 border border-gray-200 rounded-lg">
          {canManageFramework && (
            <TabsTrigger
              value="framework"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
            >
              Competency Framework
            </TabsTrigger>
          )}
          {canManageFramework && (
            <TabsTrigger
              value="cycles"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
            >
              Evaluation Cycles
            </TabsTrigger>
          )}
          {canManageFramework && (
            <TabsTrigger
              value="weights"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
            >
              Weight Configuration
            </TabsTrigger>
          )}
          {canAssignEvaluators && (
            <TabsTrigger
              value="assign-evaluators"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
            >
              Assign Evaluators
            </TabsTrigger>
          )}
        </TabsList>

        {/* Framework Tab */}
        <TabsContent value="framework" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Competency Framework
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Define core competencies and their indicators
              </p>
            </div>
            <Button
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setCreateCoreCompetencyOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Competency
            </Button>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Search competencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Competencies List */}
          {competenciesLoading || coreLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">
                  Loading competencies...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(groupedCompetencies || {}).map((group: any) => (
                <Card key={group.core?.coreCompetencyId || "uncategorized"}>
                  <CardHeader className="border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                        <div>
                          <CardTitle className="text-base font-semibold text-indigo-600">
                            {group.core?.name || "Uncategorized"}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {group.items.length} comp.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditCoreCompetency(group.core)}
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            handleDeleteCoreCompetency(
                              group.core?.coreCompetencyId,
                              group.core?.name,
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {group.items.map((competency: any, index: number) => (
                        <div
                          key={competency.competencyId}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {competency.name}
                                </span>
                                {competency.isActive ? (
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-700 text-xs">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              {competency.description && (
                                <p className="text-sm text-gray-600 mb-3">
                                  {competency.description}
                                </p>
                              )}

                              {/* Real Indicators */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="link"
                                    className="text-xs text-indigo-600 p-0 h-auto"
                                    onClick={() =>
                                      handleAddIndicator(competency)
                                    }
                                  >
                                    + Ind.
                                  </Button>
                                </div>
                                <CompetencyIndicatorsList
                                  competencyId={competency.competencyId}
                                  onEdit={handleEditIndicator}
                                  onDelete={handleDeleteIndicator}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditCompetency(competency)}
                              >
                                <Edit2 className="h-4 w-4 text-gray-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  handleDeleteCompetency(
                                    competency.competencyId,
                                    competency.name,
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 text-gray-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <Button
                        variant="link"
                        className="text-sm text-indigo-600 p-0 h-auto"
                        onClick={() =>
                          handleAddCompetency(group.core?.coreCompetencyId)
                        }
                      >
                        + Add Core Competency
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!groupedCompetencies ||
                Object.keys(groupedCompetencies).length === 0) && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No competencies found</p>
                    <Button variant="outline" className="mt-4">
                      Create Your First Competency
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Cycles Tab */}
        <TabsContent value="cycles" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Evaluation Cycles
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage evaluation periods and schedules
              </p>
            </div>
            <Button
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                if (hasActiveCycle) {
                  toast.error(
                    "Complete the active evaluation cycle before creating another one.",
                  );
                  return;
                }
                setCreateCycleOpen(true);
              }}
              disabled={hasActiveCycle}
              title={
                hasActiveCycle
                  ? "Complete the active cycle before creating another one"
                  : undefined
              }
            >
              <Plus className="h-4 w-4" />
              Create Cycle
            </Button>
          </div>

          {/* Cycle Status Tabs */}
          <CycleStatusTabs
            onEditCycle={handleEditCycle}
            onAssignEvaluators={handleOpenAssignEvaluators}
          />
        </TabsContent>

        {/* Weights Tab */}
        <TabsContent value="weights" className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Evaluation Weights
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure how different evaluator types are weighted. 
              {selectedWeightCycle && (
                <span className="font-medium text-indigo-600">
                  {" "}Total must equal {requiredWeight}%
                </span>
              )}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Cycle Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Select Evaluation Cycle{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={selectedWeightCycleId}
                    onValueChange={setSelectedWeightCycleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a cycle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles && cycles.length > 0 ? (
                        cycles.map((cycle: any) => (
                          <SelectItem
                            key={cycle.evaluationCycleId}
                            value={cycle.evaluationCycleId}
                          >
                            {cycle.name} (Base Weight: {cycle.totalEvaluationWeight || 25}%)
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No cycles available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Weight Inputs */}
                <div className="space-y-4">
                  {/* Self Evaluation */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="self-enabled"
                      checked={selfEnabled}
                      onCheckedChange={(checked) => {
                        setSelfEnabled(!!checked);
                        if (!checked) setSelfWeight(0);
                      }}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor="self-enabled"
                        className="font-medium text-gray-900 cursor-pointer"
                      >
                        Self Evaluation
                      </label>
                      <p className="text-sm text-gray-600">
                        Employee's self-assessment
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={selfWeight}
                        onChange={(e) =>
                          setSelfWeight(parseFloat(e.target.value) || 0)
                        }
                        className="w-24 text-center"
                        min="0"
                        max={requiredWeight}
                        step="0.01"
                        disabled={!selfEnabled}
                      />
                      <span className="text-gray-600 w-4">%</span>
                    </div>
                  </div>

                  {/* Peer Evaluation */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="peer-enabled"
                      checked={peerEnabled}
                      onCheckedChange={(checked) => {
                        setPeerEnabled(!!checked);
                        if (!checked) setPeerWeight(0);
                      }}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor="peer-enabled"
                        className="font-medium text-gray-900 cursor-pointer"
                      >
                        Peer Evaluation
                      </label>
                      <p className="text-sm text-gray-600">
                        Feedback from colleagues
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={peerWeight}
                        onChange={(e) =>
                          setPeerWeight(parseFloat(e.target.value) || 0)
                        }
                        className="w-24 text-center"
                        min="0"
                        max={requiredWeight}
                        step="0.01"
                        disabled={!peerEnabled}
                      />
                      <span className="text-gray-600 w-4">%</span>
                    </div>
                  </div>

                  {/* Supervisor Evaluation */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="supervisor-enabled"
                      checked={supervisorEnabled}
                      onCheckedChange={(checked) => {
                        setSupervisorEnabled(!!checked);
                        if (!checked) setSupervisorWeight(0);
                      }}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor="supervisor-enabled"
                        className="font-medium text-gray-900 cursor-pointer"
                      >
                        Supervisor Evaluation
                      </label>
                      <p className="text-sm text-gray-600">
                        Manager's assessment
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={supervisorWeight}
                        onChange={(e) =>
                          setSupervisorWeight(parseFloat(e.target.value) || 0)
                        }
                        className="w-24 text-center"
                        min="0"
                        max={requiredWeight}
                        step="0.01"
                        disabled={!supervisorEnabled}
                      />
                      <span className="text-gray-600 w-4">%</span>
                    </div>
                  </div>

                  {/* Subordinate Evaluation */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="subordinate-enabled"
                      checked={subordinateEnabled}
                      onCheckedChange={(checked) => {
                        setSubordinateEnabled(!!checked);
                        if (!checked) setSubordinateWeight(0);
                      }}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor="subordinate-enabled"
                        className="font-medium text-gray-900 cursor-pointer"
                      >
                        Subordinate Evaluation
                      </label>
                      <p className="text-sm text-gray-600">
                        Feedback from direct reports
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={subordinateWeight}
                        onChange={(e) =>
                          setSubordinateWeight(parseFloat(e.target.value) || 0)
                        }
                        className="w-24 text-center"
                        min="0"
                        max={requiredWeight}
                        step="0.01"
                        disabled={!subordinateEnabled}
                      />
                      <span className="text-gray-600 w-4">%</span>
                    </div>
                  </div>

                  {/* Total Weight Display */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900">Total Weight</p>
                      <p className="text-xs text-gray-500">
                        Sum of enabled evaluators
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          Math.abs((selfEnabled ? selfWeight : 0) + 
                                   (peerEnabled ? peerWeight : 0) + 
                                   (supervisorEnabled ? supervisorWeight : 0) + 
                                   (subordinateEnabled ? subordinateWeight : 0) - 
                                   requiredWeight) < 0.01
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {((selfEnabled ? selfWeight : 0) + 
                          (peerEnabled ? peerWeight : 0) + 
                          (supervisorEnabled ? supervisorWeight : 0) + 
                          (subordinateEnabled ? subordinateWeight : 0)).toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Required: {requiredWeight}%
                      </p>
                    </div>
                  </div>
                  {Math.abs((selfEnabled ? selfWeight : 0) + 
                           (peerEnabled ? peerWeight : 0) + 
                           (supervisorEnabled ? supervisorWeight : 0) + 
                           (subordinateEnabled ? subordinateWeight : 0) - 
                           requiredWeight) >= 0.01 && (
                    <p className="text-sm text-red-600">
                      Total weight must equal {requiredWeight}%
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSaveWeights}
                  disabled={
                    !selectedWeightCycleId || 
                    Math.abs((selfEnabled ? selfWeight : 0) + 
                            (peerEnabled ? peerWeight : 0) + 
                            (supervisorEnabled ? supervisorWeight : 0) + 
                            (subordinateEnabled ? subordinateWeight : 0) - 
                            requiredWeight) >= 0.01
                  }
                >
                  Save Weights
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assign Evaluators Tab */}
        <TabsContent value="assign-evaluators" className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Assign Evaluators
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure who evaluates whom for each cycle
            </p>
          </div>

          {cyclesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading cycles...</p>
              </div>
            </div>
          ) : cycles && cycles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cycles.map((cycle: any) => (
                <Card
                  key={cycle.evaluationCycleId}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {cycle.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(cycle.startDate).toLocaleDateString()} -{" "}
                          {new Date(cycle.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          cycle.status === EvaluationCycleStatus.ACTIVE
                            ? "bg-green-100 text-green-700"
                            : cycle.status === EvaluationCycleStatus.UPCOMING
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        }
                      >
                        {cycle.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {cycle.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {cycle.description}
                      </p>
                    )}
                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                      onClick={() => handleOpenAssignEvaluators(cycle)}
                    >
                      <Users className="h-4 w-4" />
                      Assign Evaluators
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="max-w-md mx-auto">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Evaluation Cycles
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Create an evaluation cycle first before assigning evaluators
                  </p>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setActiveSubTab("cycles")}
                  >
                    Create Cycle
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
