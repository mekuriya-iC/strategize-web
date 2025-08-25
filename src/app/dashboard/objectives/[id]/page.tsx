"use client";
import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Users, Send } from "lucide-react";
import { useObjective } from "@/hooks/useObjectives";
import { useKPIs } from "@/hooks/useKPIs";
import { useQuery } from "@apollo/client";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_KPI_SUBMISSIONS } from "@/lib/graphql/queries/submissions";
import KPIList from "@/components/objectives/KPIList";
import YearSelector from "@/components/objectives/YearSelector";
import KPIForm from "@/components/objectives/KPIForm";
import BulkSubmitDialog from "@/components/submissions/BulkSubmitDialog";
import ObjectiveWithKPIsSubmitDialog from "@/components/submissions/ObjectiveWithKPIsSubmitDialog";
import AssignObjectiveDialog from "@/components/objectives/AssignObjectiveDialog";
import { toast } from "sonner";

export default function ObjectiveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const objectiveId = params.id as string;

  const [showAddKPI, setShowAddKPI] = useState(false);
  const [editingKPI, setEditingKPI] = useState<string | null>(null);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Fetch objective details
  const {
    objective,
    loading: objectiveLoading,
    error: objectiveError,
  } = useObjective({
    objectiveId,
  });

  // Fetch KPIs for this objective
  const {
    kpis,
    loading: kpisLoading,
    error: kpisError,
    refetch,
  } = useKPIs({
    // Fetch a large page so client-side filtering by objectiveId doesn't miss items
    page: 1,
    limit: 1000,
  });

  // Fetch divisions and departments to resolve assignee names
  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 100 },
  });
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 100 },
  });

  // Fetch all objectives to check for children (assignment status)
  const { data: allObjectivesData } = useQuery(GET_OBJECTIVES, {
    variables: { page: 1, limit: 1000 }, // Large page to get all objectives
  });

  // Fetch KPI submissions specifically to get rejection reasons
  const { data: kpiSubmissionsData1 } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DIVISION" },
  });
  const { data: kpiSubmissionsData2 } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DEPARTMENT" },
  });
  const { data: kpiSubmissionsData3 } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "PERSONNEL" },
  });

  // Combine all KPI submission data
  const submissionsData = {
    submissions: {
      items: [
        ...(kpiSubmissionsData1?.submissions?.items || []),
        ...(kpiSubmissionsData2?.submissions?.items || []),
        ...(kpiSubmissionsData3?.submissions?.items || []),
      ],
    },
  };

  const divisions = divisionsData?.divisions?.items || [];
  const departments = departmentsData?.departments?.items || [];
  const allObjectives = allObjectivesData?.objectives?.items || [];
  // Build rejection reasons map for KPIs
  const kpiRejectionReasons = useMemo(() => {
    const reasonsMap: Record<string, string> = {};
    const items = submissionsData?.submissions?.items || [];

    items.forEach(
      (submission: {
        status: string;
        reason?: string;
        type: string;
        kpi?: { kpiId: string };
        objective?: { objectiveId: string; kpis?: Array<{ kpiId: string }> };
      }) => {
        if (submission.status === "REJECTED" && submission.reason) {
          if (submission.type === "KPI" && submission.kpi?.kpiId) {
            // Direct KPI submission
            reasonsMap[submission.kpi.kpiId] = submission.reason || "";
          } else if (
            submission.type === "OBJECTIVE" &&
            submission.objective?.kpis
          ) {
            // KPIs within rejected objective - inherit objective's reason
            (
              submission.objective.kpis as Array<{
                kpiId: string;
                status: string;
              }>
            ).forEach((kpi) => {
              if (kpi.status === "REJECTED") {
                reasonsMap[kpi.kpiId] = submission.reason || "";
              }
            });
          }
        }
      }
    );
    return reasonsMap;
  }, [submissionsData]);

  // Filter KPIs for this specific objective (handle null objectives)
  const objectiveKPIs = kpis.filter(
    (kpi) => kpi.objective?.objectiveId === objectiveId
  );

  // Function to check if objective has been assigned (has children)
  const hasBeenAssigned = () => {
    return (allObjectives as Array<{ parent?: { objectiveId: string } }>).some(
      (obj) => obj.parent?.objectiveId === objectiveId
    );
  };

  // Function to get all child objectives (assigned objectives)
  const getChildObjectives = () => {
    return (
      allObjectives as Array<{
        objectiveId: string;
        parent?: { objectiveId: string };
        assigneeId?: string;
        assigneeType?: "DIVISION" | "DEPARTMENT" | "EMPLOYEE";
      }>
    ).filter((obj) => obj.parent?.objectiveId === objectiveId);
  };

  // Removed unused getChildObjective function

  // Removed unused functions getAssigneeName and getAssigneeType

  const handleBack = () => {
    router.back();
  };

  const handleAddKPI = () => {
    setShowAddKPI(true);
    setEditingKPI(null);
  };

  const handleEditKPI = (kpiId: string) => {
    setEditingKPI(kpiId);
    setShowAddKPI(true);
  };

  const handleKPISuccess = () => {
    setShowAddKPI(false);
    setEditingKPI(null);
    refetch();
  };

  // KPI Selection handlers
  const handleSelectKPI = (kpiId: string) => {
    setSelectedKPIs((prev) =>
      prev.includes(kpiId)
        ? prev.filter((id) => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  const handleSelectAllKPIs = () => {
    const allKPIIds = objectiveKPIs.map((kpi) => kpi.kpiId);
    const allSelected = allKPIIds.every((id) => selectedKPIs.includes(id));

    if (allSelected) {
      setSelectedKPIs((prev) => prev.filter((id) => !allKPIIds.includes(id)));
    } else {
      setSelectedKPIs((prev) => [...new Set([...prev, ...allKPIIds])]);
    }
  };

  // Prepare data for bulk KPI submission
  const selectedKPIsForSubmission = useMemo(() => {
    if (!objective) return [];

    const filteredKPIs = objectiveKPIs
      .filter(
        (kpi) =>
          selectedKPIs.includes(kpi.kpiId) && kpi.status === "NOT_SUBMITTED"
      )
      .map((kpi) => {
        console.log("🔍 KPI being prepared for submission:", {
          kpiId: kpi.kpiId,
          kpiName: kpi.name,
          kpiStatus: kpi.status,
          objectiveType: objective.type,
          objectiveId: objective.objectiveId,
          hasObjective: !!objective,
        });

        return {
          itemId: kpi.kpiId,
          itemName: kpi.name,
          objectiveType: objective.type,
          itemType: "kpi" as const,
        };
      });

    console.log("📋 Final KPI submission data:", filteredKPIs);
    return filteredKPIs;
  }, [objectiveKPIs, selectedKPIs, objective]);

  const handleBulkKPISubmitSuccess = () => {
    setSelectedKPIs([]);
    toast.success(
      `${selectedKPIsForSubmission.length} KPI(s) submitted for approval`
    );
    refetch();
  };

  const handleAssignSuccess = () => {
    setShowAssignDialog(false);
    refetch();
  };

  if (objectiveLoading) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (objectiveError || !objective) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Objective
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">
            {objectiveError?.message || "Failed to load objective details"}
          </p>
        </div>
      </div>
    );
  }

  const statusColors = {
    NOT_SUBMITTED: "bg-pink-100 text-pink-600",
    PENDING: "bg-yellow-100 text-yellow-600",
    APPROVED: "bg-green-100 text-green-600",
    REJECTED: "bg-red-100 text-red-600",
  };

  const typeColors = {
    CORPORATE: "bg-purple-100 text-purple-600",
    DIVISION: "bg-blue-100 text-blue-600",
    DEPARTMENT: "bg-green-100 text-green-600",
    PERSONNEL: "bg-orange-100 text-orange-600",
  };

  if (showAddKPI) {
    return (
      <KPIForm
        objectiveId={objectiveId}
        kpiId={editingKPI}
        onSuccess={handleKPISuccess}
        onCancel={() => setShowAddKPI(false)}
        objective={objective}
        strategicTargetsById={(function () {
          try {
            const parentId = objective.parent?.objectiveId;
            console.log("🔍 strategicTargetsById calculation for KPIForm:", {
              objectiveType: objective.type,
              parentId,
              objectiveKPIsCount: objectiveKPIs.length,
              kpisCount: kpis.length,
            });

            if (!parentId) return {};

            // Build parent KPI list with targets using global kpis list
            const parentKPIs = kpis.filter(
              (k) => k.objective?.objectiveId === parentId
            );

            console.log("📊 Parent KPIs found for KPIForm:", {
              parentId,
              parentKPIsCount: parentKPIs.length,
              parentKPIs: parentKPIs.map((k) => ({
                kpiId: k.kpiId,
                name: k.name,
                targetsCount: k.targets?.length || 0,
              })),
            });

            const map: Record<string, Record<string, number>> = {};

            // Use index-based matching like the approval table
            objectiveKPIs.forEach((childKpi, idx) => {
              const parentKpi = parentKPIs[idx];

              console.log("🔗 Processing child KPI for KPIForm:", {
                childKpiName: childKpi.name,
                childKpiId: childKpi.kpiId,
                index: idx,
                parentKpiName: parentKpi?.name,
                parentKpiId: parentKpi?.kpiId,
              });

              if (!parentKpi?.targets) return;

              const byYear: Record<string, number> = {};

              // Process targets like the approval table
              (parentKpi.targets || []).forEach((t) => {
                const tl = t.timeline as string;
                if (tl.includes("-Q")) {
                  const year = tl.split("-")[0];
                  byYear[year] = (byYear[year] || 0) + Number(t.target || 0);
                } else {
                  byYear[tl] = Number(t.target || 0);
                }
              });

              map[childKpi.kpiId] = byYear;
              console.log("💾 Set map for child KPI in KPIForm:", {
                childKpiId: childKpi.kpiId,
                byYear,
              });
            });

            console.log("📋 Final strategicTargetsById map for KPIForm:", map);
            return map;
          } catch (error) {
            console.error(
              "❌ Error in strategicTargetsById for KPIForm:",
              error
            );
            return {} as Record<string, Record<string, number>>;
          }
        })()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#3F3F46] mb-2">
            {objective.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge className={`${typeColors[objective.type]} border-0`}>
              {objective.type}
            </Badge>
            <Badge className={`${statusColors[objective.status]} border-0`}>
              {objective.status.replace("_", " ")}
            </Badge>
            {hasBeenAssigned() && (
              <Badge
                variant="outline"
                className="text-green-600 border-green-600 text-xs font-medium"
              >
                Assigned
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {/* Submit button - show for unsubmitted objectives that are not corporate */}
          {objective.status === "NOT_SUBMITTED" &&
            objective.type !== "CORPORATE" && (
              <ObjectiveWithKPIsSubmitDialog
                objectiveId={objective.objectiveId}
                objectiveName={objective.name}
                objectiveType={objective.type}
                associatedKPIs={objectiveKPIs}
                onSubmitSuccess={() => {
                  console.log(
                    "🔄 Objective submission success callback triggered"
                  );
                  // Force refresh all data
                  refetch(); // Refresh KPIs
                  // Add a small delay and then trigger a refetch to ensure cache is updated
                  setTimeout(() => {
                    refetch();
                  }, 500);
                }}
              >
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </ObjectiveWithKPIsSubmitDialog>
            )}

          {/* Assign button - show for unassigned objectives that can be assigned */}
          {!hasBeenAssigned() &&
            (objective.type === "CORPORATE" ||
              objective.type === "DIVISION" ||
              objective.type === "DEPARTMENT") && (
              <Button
                onClick={() => {
                  // Only allow assignment if CORPORATE or if DIVISION/DEPARTMENT is APPROVED
                  if (
                    objective.type === "CORPORATE" ||
                    (objective.type === "DIVISION" &&
                      objective.status === "APPROVED") ||
                    (objective.type === "DEPARTMENT" &&
                      objective.status === "APPROVED")
                  ) {
                    setShowAssignDialog(true);
                  }
                }}
                disabled={
                  objective.type !== "CORPORATE" &&
                  objective.status !== "APPROVED"
                }
                className={
                  objective.type === "CORPORATE" ||
                  objective.status === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              >
                <Users className="w-4 h-4 mr-2" />
                {objective.type === "CORPORATE"
                  ? "Assign to Division/Department"
                  : objective.type === "DIVISION"
                  ? "Assign to Department"
                  : "Assign to Personnel"}
                {objective.type !== "CORPORATE" &&
                  objective.status !== "APPROVED" && (
                    <span className="ml-2 text-xs">(Requires Approval)</span>
                  )}
              </Button>
            )}
        </div>

        {/* Assignment info - show for objectives that have been assigned */}
        {hasBeenAssigned() && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-3">
                {objective.type === "CORPORATE"
                  ? "Assignments:"
                  : objective.type === "DIVISION"
                  ? "Assigned to Departments:"
                  : "Assigned to Employees:"}
              </h3>
              <div className="space-y-2">
                {getChildObjectives().map((childObjective, index) => {
                  const assigneeName = (() => {
                    if (
                      !childObjective?.assigneeId ||
                      !childObjective?.assigneeType
                    )
                      return null;

                    if (childObjective.assigneeType === "DIVISION") {
                      const division = (
                        divisions as Array<{ divisionId: string; name: string }>
                      ).find((d) => d.divisionId === childObjective.assigneeId);
                      return division
                        ? division.name
                        : `Division ID: ${childObjective.assigneeId}`;
                    } else if (childObjective.assigneeType === "DEPARTMENT") {
                      const department = (
                        departments as Array<{
                          departmentId: string;
                          name: string;
                        }>
                      ).find(
                        (d) => d.departmentId === childObjective.assigneeId
                      );
                      return department
                        ? department.name
                        : `Department ID: ${childObjective.assigneeId}`;
                    } else if (childObjective.assigneeType === "EMPLOYEE") {
                      return `Employee ID: ${childObjective.assigneeId}`;
                    }

                    return childObjective.assigneeId;
                  })();

                  const assigneeTypeLabel = (() => {
                    if (objective.type === "CORPORATE") {
                      return childObjective.assigneeType === "DIVISION"
                        ? "Division"
                        : "Department";
                    } else if (objective.type === "DIVISION") {
                      return "Department";
                    } else {
                      return "Employee";
                    }
                  })();

                  return (
                    <div
                      key={childObjective.objectiveId || index}
                      className="flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700 font-medium">
                        {assigneeTypeLabel}: {assigneeName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Objective Details Card */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Objective Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">{objective.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{objective.status.replace("_", " ")}</p>
          </div>
          {objective.strategicPeriod && (
            <>
              <div>
                <p className="text-sm text-gray-500">Strategic Period</p>
                <p className="font-medium">
                  {new Date(
                    objective.strategicPeriod.startDate
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(
                    objective.strategicPeriod.endDate
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Year</p>
                <div className="mt-1">
                  <YearSelector period={objective.strategicPeriod} />
                </div>
              </div>
            </>
          )}
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">
              {new Date(objective.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {objective.parent && (
            <div>
              <p className="text-sm text-gray-500">Assigned From</p>
              <p className="font-medium text-blue-600">
                {objective.parent.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* KPIs Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
          <Button
            onClick={handleAddKPI}
            className="bg-[#3838EC] hover:bg-[#2e2ed6]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add KPI
          </Button>
        </div>

        {/* Bulk Actions for KPIs - Do not show for Corporate Objectives */}
        {objective.type !== "CORPORATE" &&
          objectiveKPIs.length > 0 &&
          selectedKPIsForSubmission.length > 0 && (
            <div className="mb-4 flex justify-end">
              <BulkSubmitDialog
                items={selectedKPIsForSubmission}
                itemType="kpis"
                onSubmitSuccess={handleBulkKPISubmitSuccess}
              >
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Submit {selectedKPIsForSubmission.length} KPI
                  {selectedKPIsForSubmission.length !== 1 ? "s" : ""} for
                  Approval
                </Button>
              </BulkSubmitDialog>
            </div>
          )}

        {kpisLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading KPIs...</p>
          </div>
        ) : kpisError ? (
          <div className="text-center py-8">
            <p className="text-red-600">
              Error loading KPIs: {kpisError.message}
            </p>
          </div>
        ) : objectiveKPIs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              No KPIs have been added to this objective yet.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click &quot;Add KPI&quot; to get started.
            </p>
          </div>
        ) : (
          <KPIList
            kpis={objectiveKPIs}
            allKpis={kpis}
            onEdit={handleEditKPI}
            onRefresh={refetch}
            selected={selectedKPIs}
            onSelect={handleSelectKPI}
            onSelectAll={handleSelectAllKPIs}
            showBulkActions={true}
            strategicTargetsById={(function () {
              try {
                const parentId = objective.parent?.objectiveId;
                console.log("🔍 strategicTargetsById calculation:", {
                  objectiveType: objective.type,
                  parentId,
                  objectiveKPIsCount: objectiveKPIs.length,
                  kpisCount: kpis.length,
                });

                if (!parentId) return {};

                // Build parent KPI list with targets using global kpis list
                const parentKPIs = kpis.filter(
                  (k) => k.objective?.objectiveId === parentId
                );

                console.log("📊 Parent KPIs found:", {
                  parentId,
                  parentKPIsCount: parentKPIs.length,
                  parentKPIs: parentKPIs.map((k) => ({
                    kpiId: k.kpiId,
                    name: k.name,
                    targetsCount: k.targets?.length || 0,
                  })),
                });

                const map: Record<string, Record<string, number>> = {};

                // Use index-based matching like the approval table
                objectiveKPIs.forEach((childKpi, idx) => {
                  const parentKpi = parentKPIs[idx];

                  console.log("🔗 Processing child KPI:", {
                    childKpiName: childKpi.name,
                    childKpiId: childKpi.kpiId,
                    index: idx,
                    parentKpiName: parentKpi?.name,
                    parentKpiId: parentKpi?.kpiId,
                  });

                  if (!parentKpi?.targets) return;

                  const byYear: Record<string, number> = {};

                  // Process targets like the approval table
                  (parentKpi.targets || []).forEach((t) => {
                    const tl = t.timeline as string;
                    if (tl.includes("-Q")) {
                      const year = tl.split("-")[0];
                      byYear[year] =
                        (byYear[year] || 0) + Number(t.target || 0);
                    } else {
                      byYear[tl] = Number(t.target || 0);
                    }
                  });

                  map[childKpi.kpiId] = byYear;
                  console.log("💾 Set map for child KPI:", {
                    childKpiId: childKpi.kpiId,
                    byYear,
                  });
                });

                console.log("📋 Final strategicTargetsById map:", map);
                return map;
              } catch (error) {
                console.error("❌ Error in strategicTargetsById:", error);
                return {} as Record<string, Record<string, number>>;
              }
            })()}
            childQuartersByParentId={(function () {
              try {
                // If this is a corporate objective, build child quarters map
                if (objective.type !== "CORPORATE") return {};

                // Find all child objectives that inherit from this corporate objective
                const childObjectives = (
                  allObjectives as Array<{
                    objectiveId: string;
                    parent?: { objectiveId: string } | null;
                  }>
                ).filter((obj) => obj.parent?.objectiveId === objectiveId);

                const map: Record<
                  string,
                  Record<
                    string,
                    { q1?: number; q2?: number; q3?: number; q4?: number }
                  >
                > = {};

                // For each corporate KPI, collect quarters from all child KPIs
                objectiveKPIs.forEach((corporateKpi, kpiIndex) => {
                  const yearQuartersMap: Record<
                    string,
                    { q1?: number; q2?: number; q3?: number; q4?: number }
                  > = {};

                  // Collect quarterly data from all child objectives for this KPI index
                  childObjectives.forEach(
                    (childObj: { objectiveId: string }) => {
                      const childKpis = kpis.filter(
                        (k) => k.objective?.objectiveId === childObj.objectiveId
                      );
                      const childKpi = childKpis[kpiIndex]; // Match by index

                      if (childKpi?.targets) {
                        childKpi.targets.forEach(
                          (target: { timeline: string; target: number }) => {
                            const parts = target.timeline.split("-");
                            if (parts.length === 2) {
                              const [year, quarter] = parts;
                              if (quarter.startsWith("Q")) {
                                if (!yearQuartersMap[year]) {
                                  yearQuartersMap[year] = {};
                                }
                                const quarterNum = quarter.toLowerCase() as
                                  | "q1"
                                  | "q2"
                                  | "q3"
                                  | "q4";
                                yearQuartersMap[year][quarterNum] =
                                  (yearQuartersMap[year][quarterNum] || 0) +
                                  Number(target.target || 0);
                              }
                            }
                          }
                        );
                      }
                    }
                  );

                  map[corporateKpi.kpiId] = yearQuartersMap;
                });

                return map;
              } catch (error) {
                console.error("Error building childQuartersByParentId:", error);
                return {};
              }
            })()}
            kpiRejectionReasons={kpiRejectionReasons}
            currentObjective={{
              type: objective.type,
              parent: objective.parent
                ? {
                    type:
                      allObjectives.find(
                        (obj: { objectiveId: string; type?: string }) =>
                          obj.objectiveId === objective.parent?.objectiveId
                      )?.type || "UNKNOWN",
                    name: objective.parent.name,
                  }
                : null,
            }}
          />
        )}
      </div>

      {/* Assign Objective Dialog */}
      <AssignObjectiveDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        objective={objective}
        kpis={objectiveKPIs}
        onSuccess={handleAssignSuccess}
      />
    </div>
  );
}
