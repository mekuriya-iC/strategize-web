"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import {
  Network,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CASCADE_MAPPINGS_BY_PERIOD,
  GET_TOTAL_SCORECARD_SCORE,
} from "@/lib/graphql/queries/kpi-scorecard";
import {
  CREATE_CASCADE_MAPPING,
  DELETE_CASCADE_MAPPING,
} from "@/lib/graphql/mutations/kpi-scorecard";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CascadeMapping {
  kpiCascadeMappingId: string;
  sourceKpi: {
    kpiId: string;
    name: string;
  };
  sourceLevel: string;
  targetKpi: {
    kpiId: string;
    name: string;
  };
  targetLevel: string;
  isActive: boolean;
  createdAt: string;
}

export default function CascadeMappingManager() {
  // const { can } = usePermissions();
  const canManage = true; // TODO: Add proper permission check when KPI scorecard permissions are defined

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<string | null>(null);

  // Form state
  const [sourceKpiId, setSourceKpiId] = useState<string>("");
  const [sourceLevel, setSourceLevel] = useState<string>("");
  const [sourceEntityId, setSourceEntityId] = useState<string>("");
  const [targetKpiId, setTargetKpiId] = useState<string>("");
  const [targetLevel, setTargetLevel] = useState<string>("");
  const [targetEntityId, setTargetEntityId] = useState<string>("");

  // Fetch strategic periods
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 50 },
  });

  const periods = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((p: any) => p.isActive);

  // Set active period as default
  useEffect(() => {
    if (activePeriod && !selectedPeriodId) {
      setSelectedPeriodId(activePeriod.strategicPeriodId);
    }
  }, [activePeriod, selectedPeriodId]);

  // Fetch cascade mappings
  const {
    data: mappingsData,
    loading: mappingsLoading,
    refetch: refetchMappings,
  } = useQuery(GET_CASCADE_MAPPINGS_BY_PERIOD, {
    variables: { periodId: selectedPeriodId },
    skip: !selectedPeriodId,
    fetchPolicy: "network-only",
  });

  const mappings: CascadeMapping[] =
    mappingsData?.cascadeMappingsByPeriod || [];

  // Fetch KPIs for dropdowns
  const { data: kpisData } = useQuery(GET_KPIS, {
    variables: { page: 1, limit: 500 },
  });

  const kpis = kpisData?.kpis?.items || [];

  // Fetch entities based on level
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: sourceLevel !== "INDIVIDUAL" && targetLevel !== "INDIVIDUAL",
  });

  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    skip: sourceLevel !== "DEPARTMENT" && targetLevel !== "DEPARTMENT",
  });

  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 },
    skip: sourceLevel !== "DIVISION" && targetLevel !== "DIVISION",
  });

  const employees = employeesData?.employees?.items || [];
  const departments = departmentsData?.departments?.items || [];
  const divisions = divisionsData?.divisions?.items || [];

  // Mutations
  const [createMapping, { loading: createLoading }] = useMutation(
    CREATE_CASCADE_MAPPING,
    {
      onCompleted: () => {
        toast.success("Cascade mapping has been created successfully");
        setIsCreateDialogOpen(false);
        resetForm();
        refetchMappings();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create cascade mapping");
      },
    }
  );

  const [deleteMapping, { loading: deleteLoading }] = useMutation(
    DELETE_CASCADE_MAPPING,
    {
      onCompleted: () => {
        toast.success("Cascade mapping has been deleted successfully");
        setDeleteDialogOpen(false);
        setMappingToDelete(null);
        refetchMappings();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete cascade mapping");
      },
    }
  );

  const resetForm = () => {
    setSourceKpiId("");
    setSourceLevel("");
    setSourceEntityId("");
    setTargetKpiId("");
    setTargetLevel("");
    setTargetEntityId("");
  };

  const handleCreateMapping = () => {
    if (
      !sourceKpiId ||
      !sourceLevel ||
      !sourceEntityId ||
      !targetKpiId ||
      !targetLevel ||
      !targetEntityId ||
      !selectedPeriodId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate cascade direction
    const levelOrder = ["INDIVIDUAL", "DEPARTMENT", "DIVISION", "CORPORATE"];
    const sourceIndex = levelOrder.indexOf(sourceLevel);
    const targetIndex = levelOrder.indexOf(targetLevel);

    if (sourceIndex >= targetIndex) {
      toast.error(
        "Source level must be lower than target level (e.g., Individual → Department → Division)"
      );
      return;
    }

    createMapping({
      variables: {
        input: {
          sourceKpiId,
          sourceLevel,
          sourceEntityId,
          targetKpiId,
          targetLevel,
          targetEntityId,
          strategicPeriodId: selectedPeriodId,
        },
      },
    });
  };

  const handleDeleteClick = (mappingId: string) => {
    setMappingToDelete(mappingId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (mappingToDelete) {
      deleteMapping({
        variables: {
          mappingId: mappingToDelete,
        },
      });
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case "INDIVIDUAL":
        return "default";
      case "DEPARTMENT":
        return "secondary";
      case "DIVISION":
        return "outline";
      default:
        return "default";
    }
  };

  const getSourceEntities = () => {
    switch (sourceLevel) {
      case "INDIVIDUAL":
        return employees;
      case "DEPARTMENT":
        return departments;
      case "DIVISION":
        return divisions;
      default:
        return [];
    }
  };

  const getTargetEntities = () => {
    switch (targetLevel) {
      case "INDIVIDUAL":
        return employees;
      case "DEPARTMENT":
        return departments;
      case "DIVISION":
        return divisions;
      default:
        return [];
    }
  };

  const getEntityName = (entities: any[], entityId: string) => {
    const entity = entities.find((e: any) => {
      return (
        e.employeeId === entityId ||
        e.departmentId === entityId ||
        e.divisionId === entityId
      );
    });
    return entity?.fullName || entity?.name || "Unknown";
  };

  if (!canManage) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            You don't have permission to manage cascade mappings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Cascade Mapping Manager
          </h2>
          <p className="text-muted-foreground">
            Manage how KPIs cascade from individuals to departments to divisions
          </p>
        </div>
        <Network className="h-8 w-8 text-primary" />
      </div>

      {/* Period Selector & Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Strategic Period
              </label>
              <Select
                value={selectedPeriodId}
                onValueChange={setSelectedPeriodId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period: any) => (
                    <SelectItem
                      key={period.strategicPeriodId}
                      value={period.strategicPeriodId}
                    >
                      {period.name} {period.isActive ? "(Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-6">
              <Button
                onClick={() => refetchMappings()}
                variant="outline"
                size="icon"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Mapping
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Cascade Mapping</DialogTitle>
                    <DialogDescription>
                      Map a KPI from a lower level (source) to a higher level
                      (target). Actuals will aggregate upward.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-6 py-4">
                    {/* Source Section */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">
                        Source (Lower Level)
                      </h3>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Source Level *
                        </label>
                        <Select value={sourceLevel} onValueChange={setSourceLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                            <SelectItem value="DEPARTMENT">Department</SelectItem>
                            <SelectItem value="DIVISION">Division</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {sourceLevel && (
                        <>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Source Entity *
                            </label>
                            <Select
                              value={sourceEntityId}
                              onValueChange={setSourceEntityId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select entity" />
                              </SelectTrigger>
                              <SelectContent>
                                {getSourceEntities().map((entity: any) => {
                                  const id =
                                    entity.employeeId ||
                                    entity.departmentId ||
                                    entity.divisionId;
                                  const name = entity.fullName || entity.name;
                                  return (
                                    <SelectItem key={id} value={id}>
                                      {name}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Source KPI *
                            </label>
                            <Select
                              value={sourceKpiId}
                              onValueChange={setSourceKpiId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select KPI" />
                              </SelectTrigger>
                              <SelectContent>
                                {kpis.map((kpi: any) => (
                                  <SelectItem key={kpi.kpiId} value={kpi.kpiId}>
                                    {kpi.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Target Section */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">
                        Target (Higher Level)
                      </h3>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Target Level *
                        </label>
                        <Select value={targetLevel} onValueChange={setTargetLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEPARTMENT">Department</SelectItem>
                            <SelectItem value="DIVISION">Division</SelectItem>
                            <SelectItem value="CORPORATE">Corporate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {targetLevel && (
                        <>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Target Entity *
                            </label>
                            <Select
                              value={targetEntityId}
                              onValueChange={setTargetEntityId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select entity" />
                              </SelectTrigger>
                              <SelectContent>
                                {getTargetEntities().map((entity: any) => {
                                  const id =
                                    entity.employeeId ||
                                    entity.departmentId ||
                                    entity.divisionId;
                                  const name = entity.fullName || entity.name;
                                  return (
                                    <SelectItem key={id} value={id}>
                                      {name}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Target KPI *
                            </label>
                            <Select
                              value={targetKpiId}
                              onValueChange={setTargetKpiId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select KPI" />
                              </SelectTrigger>
                              <SelectContent>
                                {kpis.map((kpi: any) => (
                                  <SelectItem key={kpi.kpiId} value={kpi.kpiId}>
                                    {kpi.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Validation Help */}
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm">
                    <p className="text-blue-900 dark:text-blue-100">
                      <strong>Valid cascade directions:</strong>
                    </p>
                    <ul className="text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                      <li>✓ Individual → Department</li>
                      <li>✓ Individual → Division</li>
                      <li>✓ Department → Division</li>
                      <li>✓ Division → Corporate</li>
                    </ul>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMapping} disabled={createLoading}>
                      {createLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Mapping
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {mappingsLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading mappings...</p>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!mappingsLoading && mappings.length === 0 && selectedPeriodId && (
        <Card>
          <CardContent className="p-12 text-center">
            <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              No cascade mappings found for this period.
            </p>
            <p className="text-sm text-muted-foreground">
              Click "Create Mapping" to define how KPIs cascade between levels.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mappings Table */}
      {!mappingsLoading && mappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Cascade Mappings ({mappings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Source</th>
                    <th className="text-center p-3 font-medium w-16"></th>
                    <th className="text-left p-3 font-medium">Target</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-center p-3 font-medium">Created</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((mapping) => (
                    <tr
                      key={mapping.kpiCascadeMappingId}
                      className="border-b hover:bg-muted/50"
                    >
                      {/* Source */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <p className="font-medium">{mapping.sourceKpi.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={getLevelBadgeVariant(mapping.sourceLevel)}>
                              {mapping.sourceLevel}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Arrow */}
                      <td className="text-center p-3">
                        <ArrowRight className="h-5 w-5 text-muted-foreground mx-auto" />
                      </td>

                      {/* Target */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <p className="font-medium">{mapping.targetKpi.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={getLevelBadgeVariant(mapping.targetLevel)}>
                              {mapping.targetLevel}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="text-center p-3">
                        {mapping.isActive ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="text-center p-3 text-sm text-muted-foreground">
                        {new Date(mapping.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="text-center p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteClick(mapping.kpiCascadeMappingId)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Info Section */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold mb-2">
                How Cascade Mappings Work
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Cascade mappings define how KPI actuals flow from lower levels to
                higher levels. When scores are calculated:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>
                  1. Individual actuals are summed from approved logbook entries
                </li>
                <li>
                  2. Department actuals = Sum of mapped individual actuals
                </li>
                <li>3. Division actuals = Sum of mapped department actuals</li>
                <li>
                  4. Each level calculates its score using its own target and
                  weight
                </li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2 font-semibold">
                ⚠️ Note: Actuals cascade up, NOT scores. Each level is scored
                independently.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cascade Mapping?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the cascade mapping. Actuals will no longer
              aggregate from the source to the target. This action cannot be
              undone, but you can recreate the mapping later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
