import React, { useState, useMemo } from "react";
import { useAuthStore } from "@/stores";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  MoreVertical,
  Users,
  Plus,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useObjectivesOrder } from "@/hooks/useObjectivesOrder";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { Objective as GraphQLObjective, Kpi } from "@/types/graphql";
import EditObjectiveDialog from "./EditObjectiveDialog";
import DeleteObjectiveDialog from "./DeleteObjectiveDialog";
// import SubmitDialog from "../submissions/SubmitDialog";
import ObjectiveWithKPIsSubmitDialog from "../submissions/ObjectiveWithKPIsSubmitDialog";
import AssignObjectiveDialog from "./AssignObjectiveDialog";
import AddKPIDialog from "./AddKPIDialog";

// Re-export the GraphQL Objective type for backward compatibility
export type Objective = GraphQLObjective;

interface ObjectiveTableProps {
  objectives: Objective[];
  allObjectives?: Objective[]; // Unfiltered objectives for assignment detection
  kpis: Kpi[];
  selected: string[];
  expanded: string | null;
  onSelect: (id: string) => void;
  onSelectAll?: () => void;
  onExpand: (id: string) => void;
  onObjectiveClick: (objective: Objective) => void;
  onViewObjective?: (objective: Objective) => void;
  onEditSuccess?: () => void;
  onDeleteObjective?: (objective: Objective) => void;
  onAssignSuccess?: () => void;
  loading?: boolean;
  error?: string;
  // Optional: objective rejection reasons by objective id
  objectiveRejectionReasons?: Record<string, string>;
  // Optional: rejection reasons by KPI id
  kpiRejectionReasons?: Record<string, string>;
  // Optional: child quarters per parent KPI id and year (used at corporate level)
  childQuartersByParentId?: Record<
    string,
    Record<string, { q1?: number; q2?: number; q3?: number; q4?: number }>
  >;
  // Enable drag-and-drop sorting
  enableSorting?: boolean;
  // Callback when order changes (for optimistic updates)
  onOrderChange?: (objectives: Objective[]) => void;
}

// Sortable Table Row Component with visual feedback
interface SortableTableRowProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

function SortableTableRow({
  id,
  children,
  className,
  onClick,
}: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : "auto",
    position: "relative" as const,
    backgroundColor: isDragging ? "rgb(239 246 255)" : undefined, // Light blue when dragging
    boxShadow: isDragging ? "0 4px 12px rgba(0, 0, 0, 0.15)" : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? "ring-2 ring-blue-400" : ""}`}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <TableCell className="px-2 w-10" onClick={(e) => e.stopPropagation()}>
        <button
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded touch-none ${
            isDragging ? "cursor-grabbing" : ""
          }`}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

const statusMap = {
  NOT_SUBMITTED: { label: "Not Submitted", color: "bg-pink-100 text-pink-600" },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-600" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-600" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-600" },
};

const weightTypeLabels = {
  NUMBER: "Number",
  PERCENT: "Percent",
};

const ObjectiveTable: React.FC<ObjectiveTableProps> = ({
  objectives,
  allObjectives = objectives, // Default to objectives if not provided
  kpis,
  selected,
  expanded,
  onSelect,
  onSelectAll,
  onExpand,
  onObjectiveClick,
  onViewObjective,
  onEditSuccess,
  onDeleteObjective,
  onAssignSuccess,
  loading = false,
  error,
  objectiveRejectionReasons,
  kpiRejectionReasons,
  childQuartersByParentId,
  enableSorting = false,
  onOrderChange,
}) => {
  const user = useAuthStore((state) => state.user);
  const { saveOrder, isSaving } = useObjectivesOrder();

  // Sort objectives by order field
  const sortedObjectives = useMemo(() => {
    if (!enableSorting) return objectives;
    return [...objectives].sort((a, b) => {
      const orderA = (a as Objective & { order?: number }).order ?? Infinity;
      const orderB = (b as Objective & { order?: number }).order ?? Infinity;
      return orderA - orderB;
    });
  }, [objectives, enableSorting]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // State for tracking the currently dragged item
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeObjective = useMemo(
    () => sortedObjectives.find((obj) => obj.objectiveId === activeId),
    [sortedObjectives, activeId]
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedObjectives.findIndex(
        (obj) => obj.objectiveId === active.id
      );
      const newIndex = sortedObjectives.findIndex(
        (obj) => obj.objectiveId === over.id
      );

      const reorderedObjectives = arrayMove(
        sortedObjectives,
        oldIndex,
        newIndex
      );

      // Optimistic update
      onOrderChange?.(reorderedObjectives);

      // Calculate new order values
      const updates = reorderedObjectives.map((obj, index) => ({
        objectiveId: obj.objectiveId,
        order: index + 1,
      }));

      // Save to backend
      try {
        await saveOrder(updates);
      } catch {
        // Revert on error - the onError in the hook will show a toast
        onOrderChange?.(sortedObjectives);
      }
    }
    // Clear the active item
    setActiveId(null);
  };

  // Get objective IDs for sortable context
  const objectiveIds = useMemo(
    () => sortedObjectives.map((obj) => obj.objectiveId),
    [sortedObjectives]
  );

  // Function to determine column headers based on user's role level
  const getColumnHeaders = () => {
    const allCorporate = objectives.every((obj) => obj.type === "CORPORATE");
    const hasDiv = objectives.some((obj) => obj.type === "DIVISION");
    const hasDept = objectives.some((obj) => obj.type === "DEPARTMENT");
    const hasPers = objectives.some((obj) => obj.type === "PERSONNEL");

    // Role-based column headers
    switch (user?.role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        if (allCorporate) {
          return {
            firstColumn: "CORPORATE OBJECTIVE",
            secondColumn: null,
            showSecondColumn: false,
          };
        }
        if (hasDiv && !hasDept && !hasPers) {
          return {
            firstColumn: "CORPORATE OBJECTIVE",
            secondColumn: "DIVISION OBJECTIVE",
            showSecondColumn: true,
          };
        }
        if (hasDept && !hasPers) {
          return {
            firstColumn: "PARENT OBJECTIVE",
            secondColumn: "DEPARTMENT OBJECTIVE",
            showSecondColumn: true,
          };
        }
        if (hasPers) {
          return {
            firstColumn: "DEPARTMENT OBJECTIVE",
            secondColumn: "PERSONAL OBJECTIVE",
            showSecondColumn: true,
          };
        }
        return {
          firstColumn: "CORPORATE OBJECTIVE",
          secondColumn: "CHILD OBJECTIVE",
          showSecondColumn: true,
        };

      case "DIRECTOR":
        // Directors see DIVISION objectives with their parent CORPORATE objective info
        return {
          firstColumn: "CORPORATE OBJECTIVE",
          secondColumn: "DIVISION OBJECTIVE",
          showSecondColumn: true,
        };

      case "MANAGER":
        // Managers see DIVISION (parent) → DEPARTMENT (their assigned objectives)
        if (allCorporate) {
          return {
            firstColumn: "CORPORATE OBJECTIVE",
            secondColumn: null,
            showSecondColumn: false,
          };
        }
        return {
          firstColumn: "DIVISION OBJECTIVE",
          secondColumn: "DEPARTMENT OBJECTIVE",
          showSecondColumn: true,
        };

      case "COORDINATOR":
        // Coordinators see DIVISION (parent) → DEPARTMENT/PERSONNEL (their unit objectives)
        return {
          firstColumn: "DIVISION OBJECTIVE",
          secondColumn: "DEPARTMENT OBJECTIVE",
          showSecondColumn: true,
        };

      case "NORMAL":
        // Employees see DEPARTMENT (parent) → PERSONNEL (their assigned objectives)
        return {
          firstColumn: "DEPARTMENT OBJECTIVE",
          secondColumn: "PERSONNEL OBJECTIVE",
          showSecondColumn: true,
        };

      default:
        return {
          firstColumn: "STRATEGIC OBJECTIVE",
          secondColumn: "OBJECTIVE",
          showSecondColumn: true,
        };
    }
  };

  const columnHeaders = getColumnHeaders();

  // Function to get content for first column based on objective type and column header
  const getFirstColumnContent = (obj: Objective) => {
    // Debug logging for corporate objectives
    if (obj.type === "CORPORATE") {
      console.log(
        "Corporate objective:",
        obj.name,
        "ID:",
        obj.objectiveId,
        "Full obj:",
        obj
      );
    }

    // First priority: show parent name if available (for assigned objectives)
    if (obj.parent) {
      return obj.parent.name || "Unnamed Parent Objective";
    }

    // Second priority: show objective name if no parent (standalone objectives)
    if (!obj.name || obj.name.trim() === "") {
      return "Please add name";
    }

    return obj.name;
  };

  // Function to get content for second column based on objective type and column header
  const getSecondColumnContent = (obj: Objective) => {
    // If it's a standalone corporate objective (no parent), show "N/A"
    if (obj.type === "CORPORATE" && !obj.parent) {
      return "N/A";
    }

    // For all other objectives (including assigned ones), show the objective name
    // If no name is set, show a helpful placeholder
    if (!obj.name || obj.name.trim() === "") {
      return "Please add name";
    }

    return obj.name;
  };

  // Function to get "From:" text for first column
  const getFromText = (obj: Objective) => {
    if (obj.type === "CORPORATE") {
      return null; // No "From:" text for corporate objectives
    }

    if (obj.parent) {
      const parentObjective = allObjectives.find(
        (o) => o.objectiveId === obj.parent?.objectiveId
      );
      if (parentObjective) {
        switch (parentObjective.type) {
          case "CORPORATE":
            return "From: Corporate";
          case "DIVISION":
            return "From: Division";
          case "DEPARTMENT":
            return "From: Department";
          default:
            return "From: Parent";
        }
      }
    }

    return null;
  };

  // KPI-specific functions for expanded KPI table
  const getKpiFirstColumnContent = (kpi: Kpi) => {
    // First priority: show parent KPI name if available (for child KPIs)
    if (kpi.parent) {
      return kpi.parent.name;
    }

    // Second priority: show KPI name if no parent (standalone KPIs)
    if (!kpi.name || kpi.name.trim() === "") {
      return "Please add name";
    }

    return kpi.name;
  };

  const getKpiSecondColumnContent = (kpi: Kpi) => {
    // If it's a standalone corporate KPI (no parent), show "N/A"
    if (kpi.objective?.type === "CORPORATE" && !kpi.parent) {
      return "N/A";
    }

    // For all other KPIs (including assigned ones), show the KPI name
    if (!kpi.name || kpi.name.trim() === "") {
      return "Please add name";
    }

    return kpi.name;
  };

  const getKpiFromText = (kpi: Kpi) => {
    if (kpi.objective?.type === "CORPORATE") {
      return null; // No "From:" text for corporate KPIs
    }

    // Fallback based on current objective type
    if (kpi.objective?.type) {
      switch (kpi.objective.type) {
        case "DIVISION":
          return "From: Corporate";
        case "DEPARTMENT":
          return "From: Division";
        case "PERSONNEL":
          return "From: Department";
        default:
          return null;
      }
    }

    return null;
  };

  // Check if all objectives are corporate level
  const allObjectivesAreCorporate = objectives.every(
    (obj) => obj.type === "CORPORATE"
  );

  // Show level-specific column based on columnHeaders configuration
  const showLevelSpecificColumn = columnHeaders.showSecondColumn;

  // Show reason column only if there are rejected KPIs and not all objectives are corporate
  const showReasonColumn =
    !allObjectivesAreCorporate && kpis.some((kpi) => kpi.status === "REJECTED");
  // Show objective-level reason column when any objective is rejected (and not corporate-only view)
  const showObjectiveReasonColumn =
    !allObjectivesAreCorporate &&
    objectives.some((o) => o.status === "REJECTED");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedObjectiveForAssignment, setSelectedObjectiveForAssignment] =
    useState<Objective | null>(null);
  // Calculate if all objectives are selected
  const allSelected =
    objectives.length > 0 &&
    objectives.every((obj) => selected.includes(obj.objectiveId));

  // Helper function to get KPIs for a specific objective
  const getKPIsForObjective = (objectiveId: string) => {
    return kpis.filter((kpi) => kpi.objective?.objectiveId === objectiveId);
  };

  // Helper: aggregate targets into yearly totals
  const getYearlyTotals = (targets: Kpi["targets"]) => {
    const totals: Record<string, number> = {};
    const quarterlySums: Record<string, number> = {};
    const yearsWithExplicitTotal: Set<string> = new Set();

    // First, find explicit yearly totals
    for (const t of targets) {
      if (!t.timeline.includes("-")) {
        const year = t.timeline;
        totals[year] = Number(t.target || 0);
        yearsWithExplicitTotal.add(year);
      }
    }

    // Then, sum quarters for years that DON'T have an explicit total
    for (const t of targets) {
      const [year, quarter] = t.timeline.split("-");
      if (quarter && !yearsWithExplicitTotal.has(year)) {
        quarterlySums[year] =
          (quarterlySums[year] || 0) + Number(t.target || 0);
      }
    }

    // Merge the quarterly sums into the main totals object
    for (const year in quarterlySums) {
      if (!totals[year]) {
        totals[year] = quarterlySums[year];
      }
    }

    const years = Object.keys(totals).sort((a, b) => {
      const aNum = parseInt(a.split("/")?.[0] || "0", 10);
      const bNum = parseInt(b.split("/")?.[0] || "0", 10);
      return aNum - bNum;
    });

    return { years, totals } as const;
  };

  // Helper: map quarters per year
  const getQuartersByYear = (targets: Kpi["targets"]) => {
    const qByYear: Record<
      string,
      { q1?: number; q2?: number; q3?: number; q4?: number }
    > = {};
    for (const t of targets) {
      const [year, quarter] = t.timeline.split("-");
      if (!qByYear[year]) qByYear[year] = {};
      if (quarter) {
        const qn = quarter.toUpperCase();
        if (qn === "Q1") qByYear[year].q1 = Number(t.target || 0);
        if (qn === "Q2") qByYear[year].q2 = Number(t.target || 0);
        if (qn === "Q3") qByYear[year].q3 = Number(t.target || 0);
        if (qn === "Q4") qByYear[year].q4 = Number(t.target || 0);
      }
    }
    const years = Object.keys(qByYear).sort((a, b) => {
      const aNum = parseInt(a.split("/")?.[0] || "0", 10);
      const bNum = parseInt(b.split("/")?.[0] || "0", 10);
      return aNum - bNum;
    });
    return { years, qByYear } as const;
  };

  // Helper function to check if an objective has been assigned (has children)
  const hasBeenAssigned = (objectiveId: string) => {
    return allObjectives.some((obj) => obj.parent?.objectiveId === objectiveId);
  };

  // Handle assign objective
  const handleAssignObjective = (objective: Objective) => {
    setSelectedObjectiveForAssignment(objective);
    setAssignDialogOpen(true);
  };

  // Handle assign success
  const handleAssignSuccess = () => {
    onAssignSuccess?.();
    setAssignDialogOpen(false);
    setSelectedObjectiveForAssignment(null);
  };

  if (loading) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading objectives...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <div className="p-8 text-center">
          <p className="text-red-600">Error loading objectives: {error}</p>
        </div>
      </div>
    );
  }

  if (objectives.length === 0) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <div className="p-8 text-center">
          <p className="text-gray-600">No objectives found.</p>
        </div>
      </div>
    );
  }

  // Table content wrapped in DnD context if sorting is enabled
  const tableContent = (
    <Table className="border-none">
      <TableHeader>
        <TableRow className="bg-muted/60 hover:bg-muted/60">
          {/* Drag Handle Column */}
          {enableSorting && (
            <TableHead className="px-2 w-10">
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              )}
            </TableHead>
          )}
          <TableHead className="px-6 py-3 w-12">
            {onSelectAll && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
            )}
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
            {columnHeaders.firstColumn}
          </TableHead>
          {showLevelSpecificColumn && (
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              {columnHeaders.secondColumn}
            </TableHead>
          )}
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
            TYPE
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
            KPIs
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
            STRATEGIC PERIOD
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
            STATUS
          </TableHead>
          {showObjectiveReasonColumn && (
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              REASON
            </TableHead>
          )}
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
            ACTIONS
          </TableHead>
          <TableHead className="px-6 py-3 w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedObjectives.map((obj, idx) => {
          const objectiveKPIs = getKPIsForObjective(obj.objectiveId);
          // Removed unused parentKpisForObj variable
          return (
            <React.Fragment key={obj.objectiveId}>
              {enableSorting ? (
                <SortableTableRow
                  id={obj.objectiveId}
                  className={`border-b border-gray-100 ${
                    selected.includes(obj.objectiveId)
                      ? "bg-blue-50"
                      : idx % 2 === 1
                      ? "bg-white"
                      : "bg-[#ECECFF]"
                  } hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => onObjectiveClick(obj)}
                >
                  <TableCell
                    className="px-6 py-4 w-12"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected.includes(obj.objectiveId)}
                      onCheckedChange={() => onSelect(obj.objectiveId)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                    <div
                      className="truncate"
                      title={getFirstColumnContent(obj)}
                    >
                      {getFirstColumnContent(obj) || (
                        <span className="text-gray-400 italic text-sm">
                          {obj.name || "No name"}
                        </span>
                      )}
                    </div>
                    {getFromText(obj) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {getFromText(obj)}
                      </div>
                    )}
                  </TableCell>
                  {showLevelSpecificColumn && (
                    <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                      <div
                        className="truncate"
                        title={getSecondColumnContent(obj)}
                      >
                        {getSecondColumnContent(obj) === "N/A" ? (
                          <span className="text-gray-400 italic text-sm">
                            N/A
                          </span>
                        ) : (
                          getSecondColumnContent(obj)
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="px-6 py-4 text-gray-600">
                    <Badge
                      className={`${
                        obj.type === "CORPORATE"
                          ? "bg-purple-100 text-purple-600"
                          : obj.type === "DIVISION"
                          ? "bg-blue-100 text-blue-600"
                          : obj.type === "DEPARTMENT"
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      } rounded-full px-3 py-1 text-xs font-medium border-0`}
                    >
                      {obj.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {objectiveKPIs.length} KPI
                        {objectiveKPIs.length !== 1 ? "s" : ""}
                      </span>
                      {objectiveKPIs.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {
                            objectiveKPIs.filter(
                              (kpi) => kpi.status === "APPROVED"
                            ).length
                          }{" "}
                          approved
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    <div className="flex flex-col gap-1">
                      {obj.strategicPeriod ? (
                        <>
                          <span className="text-sm font-medium">
                            {new Date(
                              obj.strategicPeriod.startDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(
                              obj.strategicPeriod.endDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {obj.strategicPeriod.length}{" "}
                            {obj.strategicPeriod.length === 1
                              ? "year"
                              : "years"}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 italic">
                          No period assigned
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${
                          statusMap[obj.status].color
                        } rounded-full px-3 py-1 text-xs font-medium border-0`}
                      >
                        {statusMap[obj.status].label}
                      </Badge>
                      {hasBeenAssigned(obj.objectiveId) && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600 text-xs font-medium"
                        >
                          Assigned
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {showObjectiveReasonColumn && (
                    <TableCell className="px-6 py-4">
                      {obj.status === "REJECTED" ? (
                        <span className="text-xs text-red-600 italic">
                          {objectiveRejectionReasons?.[obj.objectiveId] ||
                            "No reason provided"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell
                    className="px-6 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewObjective?.(obj)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EditObjectiveDialog
                            objective={obj}
                            onEditSuccess={onEditSuccess}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              Edit
                            </DropdownMenuItem>
                          </EditObjectiveDialog>
                          <AddKPIDialog
                            objective={obj}
                            onSuccess={onEditSuccess}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add KPI
                            </DropdownMenuItem>
                          </AddKPIDialog>
                          {/* Assign option - show for CORPORATE, DIVISION, and DEPARTMENT objectives (never for PERSONNEL) */}
                          {(obj.type === "CORPORATE" ||
                            obj.type === "DIVISION" ||
                            obj.type === "DEPARTMENT") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  // Only allow assignment if has KPIs AND (CORPORATE or DIVISION/DEPARTMENT is APPROVED)
                                  const hasKPIs = (obj.kpis?.length ?? 0) > 0;
                                  if (
                                    hasKPIs &&
                                    (obj.type === "CORPORATE" ||
                                      (obj.type === "DIVISION" &&
                                        obj.status === "APPROVED") ||
                                      (obj.type === "DEPARTMENT" &&
                                        obj.status === "APPROVED"))
                                  ) {
                                    handleAssignObjective(obj);
                                  }
                                }}
                                disabled={
                                  // Disable if no KPIs
                                  (obj.kpis?.length ?? 0) === 0 ||
                                  // No assign for personal level
                                  (obj.type as string) === "PERSONNEL" ||
                                  (obj.type !== "CORPORATE" &&
                                    obj.status !== "APPROVED")
                                }
                                className={
                                  (obj.kpis?.length ?? 0) > 0 &&
                                  (obj.type === "CORPORATE" ||
                                    obj.status === "APPROVED")
                                    ? "text-green-600 hover:text-green-700"
                                    : "text-gray-400 cursor-not-allowed"
                                }
                              >
                                <Users className="w-4 h-4 mr-2" />
                                {obj.type === "CORPORATE"
                                  ? "Assign to Division/Department"
                                  : obj.type === "DIVISION"
                                  ? "Assign to Department"
                                  : "Assign to Personnel"}
                                {(obj.kpis?.length ?? 0) === 0 ? (
                                  <span className="ml-2 text-xs">
                                    (Add KPI first)
                                  </span>
                                ) : (
                                  obj.type !== "CORPORATE" &&
                                  obj.status !== "APPROVED" && (
                                    <span className="ml-2 text-xs">
                                      (Requires Approval)
                                    </span>
                                  )
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
                          {/* Submit option - only show if objective is not already submitted and not corporate */}
                          {obj.status === "NOT_SUBMITTED" &&
                            obj.type !== "CORPORATE" && (
                              <>
                                <DropdownMenuSeparator />
                                {(obj.kpis?.length ?? 0) > 0 ? (
                                  <ObjectiveWithKPIsSubmitDialog
                                    objectiveId={obj.objectiveId}
                                    objectiveName={obj.name}
                                    objectiveType={obj.type}
                                    associatedKPIs={getKPIsForObjective(
                                      obj.objectiveId
                                    )}
                                    onSubmitSuccess={onEditSuccess}
                                  >
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      Submit for Approval
                                    </DropdownMenuItem>
                                  </ObjectiveWithKPIsSubmitDialog>
                                ) : (
                                  <DropdownMenuItem
                                    disabled
                                    className="text-gray-400 cursor-not-allowed"
                                  >
                                    Submit for Approval
                                    <span className="ml-2 text-xs">
                                      (Add KPI first)
                                    </span>
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          {/* Resubmit option - only show if objective is rejected and not corporate */}
                          {obj.status === "REJECTED" &&
                            obj.type !== "CORPORATE" && (
                              <>
                                <DropdownMenuSeparator />
                                {(obj.kpis?.length ?? 0) > 0 ? (
                                  <ObjectiveWithKPIsSubmitDialog
                                    objectiveId={obj.objectiveId}
                                    objectiveName={obj.name}
                                    objectiveType={obj.type}
                                    associatedKPIs={getKPIsForObjective(
                                      obj.objectiveId
                                    )}
                                    onSubmitSuccess={onEditSuccess}
                                  >
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-orange-600 hover:text-orange-700"
                                    >
                                      Resubmit for Approval
                                    </DropdownMenuItem>
                                  </ObjectiveWithKPIsSubmitDialog>
                                ) : (
                                  <DropdownMenuItem
                                    disabled
                                    className="text-gray-400 cursor-not-allowed"
                                  >
                                    Resubmit for Approval
                                    <span className="ml-2 text-xs">
                                      (Add KPI first)
                                    </span>
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          <DropdownMenuSeparator />
                          <DeleteObjectiveDialog
                            objectiveId={obj.objectiveId}
                            objectiveName={obj.name}
                            onDeleteSuccess={() => onDeleteObjective?.(obj)}
                          >
                            <DropdownMenuItem
                              className={`${
                                objectiveKPIs.length > 0
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-600 hover:text-red-700"
                              }`}
                              disabled={objectiveKPIs.length > 0}
                              onSelect={(e) => e.preventDefault()}
                              title={
                                objectiveKPIs.length > 0
                                  ? `Cannot delete: ${
                                      objectiveKPIs.length
                                    } KPI${
                                      objectiveKPIs.length !== 1 ? "s" : ""
                                    } associated`
                                  : "Delete objective"
                              }
                            >
                              Delete
                              {objectiveKPIs.length > 0 && (
                                <span className="ml-auto text-xs">
                                  ({objectiveKPIs.length} KPI
                                  {objectiveKPIs.length !== 1 ? "s" : ""})
                                </span>
                              )}
                            </DropdownMenuItem>
                          </DeleteObjectiveDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 w-12">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpand(obj.objectiveId);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {expanded === obj.objectiveId ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </TableCell>
                </SortableTableRow>
              ) : (
                <TableRow
                  className={`border-b border-gray-100 ${
                    selected.includes(obj.objectiveId)
                      ? "bg-blue-50"
                      : idx % 2 === 1
                      ? "bg-white"
                      : "bg-[#ECECFF]"
                  } hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => onObjectiveClick(obj)}
                >
                  <TableCell
                    className="px-6 py-4 w-12"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected.includes(obj.objectiveId)}
                      onCheckedChange={() => onSelect(obj.objectiveId)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                    <div
                      className="truncate"
                      title={getFirstColumnContent(obj)}
                    >
                      {getFirstColumnContent(obj) || (
                        <span className="text-gray-400 italic text-sm">
                          {obj.name || "No name"}
                        </span>
                      )}
                    </div>
                    {getFromText(obj) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {getFromText(obj)}
                      </div>
                    )}
                  </TableCell>
                  {showLevelSpecificColumn && (
                    <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                      <div
                        className="truncate"
                        title={getSecondColumnContent(obj)}
                      >
                        {getSecondColumnContent(obj) === "N/A" ? (
                          <span className="text-gray-400 italic text-sm">
                            N/A
                          </span>
                        ) : (
                          getSecondColumnContent(obj)
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="px-6 py-4 text-gray-600">
                    <Badge
                      className={`${
                        obj.type === "CORPORATE"
                          ? "bg-purple-100 text-purple-600"
                          : obj.type === "DIVISION"
                          ? "bg-blue-100 text-blue-600"
                          : obj.type === "DEPARTMENT"
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      } rounded-full px-3 py-1 text-xs font-medium border-0`}
                    >
                      {obj.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {objectiveKPIs.length} KPI
                        {objectiveKPIs.length !== 1 ? "s" : ""}
                      </span>
                      {objectiveKPIs.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {
                            objectiveKPIs.filter(
                              (kpi) => kpi.status === "APPROVED"
                            ).length
                          }{" "}
                          approved
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    <div className="flex flex-col gap-1">
                      {obj.strategicPeriod ? (
                        <>
                          <span className="text-sm font-medium">
                            {new Date(
                              obj.strategicPeriod.startDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(
                              obj.strategicPeriod.endDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {obj.strategicPeriod.length}{" "}
                            {obj.strategicPeriod.length === 1
                              ? "year"
                              : "years"}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 italic">
                          No period assigned
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${
                          statusMap[obj.status].color
                        } rounded-full px-3 py-1 text-xs font-medium border-0`}
                      >
                        {statusMap[obj.status].label}
                      </Badge>
                      {hasBeenAssigned(obj.objectiveId) && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600 text-xs font-medium"
                        >
                          Assigned
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {showObjectiveReasonColumn && (
                    <TableCell className="px-6 py-4">
                      {obj.status === "REJECTED" ? (
                        <span className="text-xs text-red-600 italic">
                          {objectiveRejectionReasons?.[obj.objectiveId] ||
                            "No reason provided"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell
                    className="px-6 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewObjective?.(obj)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EditObjectiveDialog
                            objective={obj}
                            onEditSuccess={onEditSuccess}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              Edit
                            </DropdownMenuItem>
                          </EditObjectiveDialog>
                          <AddKPIDialog
                            objective={obj}
                            onSuccess={onEditSuccess}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add KPI
                            </DropdownMenuItem>
                          </AddKPIDialog>
                          <DropdownMenuSeparator />
                          <DeleteObjectiveDialog
                            objectiveId={obj.objectiveId}
                            objectiveName={obj.name}
                            onDeleteSuccess={() => onDeleteObjective?.(obj)}
                          >
                            <DropdownMenuItem
                              className={
                                objectiveKPIs.length > 0
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-600 hover:text-red-700"
                              }
                              disabled={objectiveKPIs.length > 0}
                              onSelect={(e) => e.preventDefault()}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DeleteObjectiveDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 w-12">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpand(obj.objectiveId);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {expanded === obj.objectiveId ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              )}

              {/* Expanded KPI Details */}
              {expanded === obj.objectiveId && objectiveKPIs.length > 0 && (
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={8} className="px-6 py-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium mb-3 text-gray-900">
                        Key Performance Indicators
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                {columnHeaders.firstColumn}
                              </th>
                              {showLevelSpecificColumn && (
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  {columnHeaders.secondColumn}
                                </th>
                              )}
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                Weight
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                Baseline
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                Targets
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                              {showReasonColumn && (
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  Reason
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {objectiveKPIs.map((kpi, kpiIdx) => (
                              <tr
                                key={kpi.kpiId}
                                className={
                                  kpiIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="py-2 px-3 font-medium text-gray-900">
                                  {/* First column - show parent KPI name when available */}
                                  {getKpiFirstColumnContent(kpi)}
                                  {getKpiFromText(kpi) && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {getKpiFromText(kpi)}
                                    </div>
                                  )}
                                </td>
                                {showLevelSpecificColumn && (
                                  <td className="py-2 px-3 font-medium text-gray-900">
                                    {/* Second column - show KPI name or N/A */}
                                    {getKpiSecondColumnContent(kpi) ===
                                    "N/A" ? (
                                      <span className="text-gray-400 italic text-xs">
                                        N/A
                                      </span>
                                    ) : (
                                      getKpiSecondColumnContent(kpi)
                                    )}
                                  </td>
                                )}
                                <td className="py-2 px-3 text-gray-600">
                                  {kpi.weight}
                                </td>
                                <td className="py-2 px-3 text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <span>{kpi.baseline}</span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {weightTypeLabels[
                                        kpi.unitType as keyof typeof weightTypeLabels
                                      ] || "Unknown"}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-gray-600">
                                  {kpi.targets && kpi.targets.length > 0 ? (
                                    (() => {
                                      if (kpi.status === "APPROVED") {
                                        // For corporate KPIs, always show their own targets
                                        // For child KPIs, show child quarters if available
                                        const corporate =
                                          kpi.objective?.type === "CORPORATE";
                                        const childQuarters = !corporate
                                          ? childQuartersByParentId?.[
                                              kpi.kpiId
                                            ] || {}
                                          : undefined;
                                        const hasChildQuarters =
                                          childQuarters &&
                                          Object.keys(childQuarters).length > 0;
                                        const { years, totals } =
                                          hasChildQuarters
                                            ? (() => {
                                                const yrs = Object.keys(
                                                  childQuarters as Record<
                                                    string,
                                                    {
                                                      q1?: number;
                                                      q2?: number;
                                                      q3?: number;
                                                      q4?: number;
                                                    }
                                                  >
                                                ).sort(
                                                  (a, b) =>
                                                    parseInt(
                                                      a.split("/")?.[0] || "0"
                                                    ) -
                                                    parseInt(
                                                      b.split("/")?.[0] || "0"
                                                    )
                                                );
                                                const t: Record<
                                                  string,
                                                  number
                                                > = {};
                                                yrs.forEach((y) => {
                                                  const q =
                                                    (
                                                      childQuarters as Record<
                                                        string,
                                                        {
                                                          q1?: number;
                                                          q2?: number;
                                                          q3?: number;
                                                          q4?: number;
                                                        }
                                                      >
                                                    )[y] || {};
                                                  t[y] =
                                                    (q.q1 || 0) +
                                                    (q.q2 || 0) +
                                                    (q.q3 || 0) +
                                                    (q.q4 || 0);
                                                });
                                                return {
                                                  years: yrs,
                                                  totals: t,
                                                } as const;
                                              })()
                                            : getYearlyTotals(kpi.targets);
                                        const qByYear = hasChildQuarters
                                          ? childQuarters
                                          : getQuartersByYear(kpi.targets)
                                              .qByYear;
                                        const qYears = Object.keys(
                                          qByYear || {}
                                        );
                                        return (
                                          <div
                                            className="inline-grid gap-x-8"
                                            style={{
                                              gridTemplateColumns: `repeat(${years.length}, minmax(80px, auto))`,
                                            }}
                                          >
                                            {years.map((y) => {
                                              const q =
                                                (
                                                  qByYear as Record<
                                                    string,
                                                    {
                                                      q1?: number;
                                                      q2?: number;
                                                      q3?: number;
                                                      q4?: number;
                                                    }
                                                  >
                                                )[y] || {};
                                              return (
                                                <div
                                                  key={`col-${y}`}
                                                  className="flex flex-col"
                                                >
                                                  {/* Year header */}
                                                  <span className="text-gray-400 text-[10px] font-medium tracking-wider uppercase mb-1">
                                                    {y}
                                                  </span>
                                                  {/* Year total */}
                                                  <div className="flex flex-col gap-1 mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-gray-900 font-medium">
                                                        {Number(
                                                          totals[y]
                                                        ).toFixed(1)}
                                                      </span>
                                                      <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                      >
                                                        {weightTypeLabels[
                                                          kpi.unitType as keyof typeof weightTypeLabels
                                                        ] || "Unknown"}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                  {/* Quarters - only show for non-corporate KPIs */}
                                                  {qYears.includes(y) &&
                                                    kpi.objective?.type !==
                                                      "CORPORATE" && (
                                                      <div className="flex flex-col gap-1">
                                                        {(
                                                          [
                                                            "Q1",
                                                            "Q2",
                                                            "Q3",
                                                            "Q4",
                                                          ] as const
                                                        ).map((label, idx) => (
                                                          <div
                                                            key={label}
                                                            className="flex items-center justify-between text-xs"
                                                          >
                                                            <span className="text-gray-600 font-medium">
                                                              {label}:
                                                            </span>
                                                            <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700 ml-1">
                                                              {Number(
                                                                (
                                                                  q as Record<
                                                                    string,
                                                                    number
                                                                  >
                                                                )[
                                                                  `q${idx + 1}`
                                                                ] ?? 0
                                                              ).toFixed(1)}
                                                            </span>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      }
                                      // Handle both quarterly and yearly targets for non-approved KPIs
                                      const { years: quarterYears, qByYear } =
                                        getQuartersByYear(kpi.targets);
                                      const { years: yearlyYears, totals } =
                                        getYearlyTotals(kpi.targets);

                                      const hasQuarters =
                                        quarterYears.length > 0;
                                      const hasYearly = yearlyYears.length > 0;

                                      if (hasQuarters) {
                                        // Show quarterly breakdown for inherited KPIs
                                        return (
                                          <div
                                            className="inline-grid gap-x-6"
                                            style={{
                                              gridTemplateColumns: `repeat(${quarterYears.length}, minmax(160px, auto))`,
                                            }}
                                          >
                                            {quarterYears.map((y) => (
                                              <span
                                                key={`hdr-${y}`}
                                                className="text-gray-400 text-[10px] font-medium tracking-wider uppercase"
                                              >
                                                {y}
                                              </span>
                                            ))}
                                            {quarterYears.map((y) => {
                                              const q = qByYear[y] || {};
                                              const chips = [
                                                {
                                                  label: "Q1",
                                                  value: Number(
                                                    q.q1 ?? 0
                                                  ).toFixed(1),
                                                },
                                                {
                                                  label: "Q2",
                                                  value: Number(
                                                    q.q2 ?? 0
                                                  ).toFixed(1),
                                                },
                                                {
                                                  label: "Q3",
                                                  value: Number(
                                                    q.q3 ?? 0
                                                  ).toFixed(1),
                                                },
                                                {
                                                  label: "Q4",
                                                  value: Number(
                                                    q.q4 ?? 0
                                                  ).toFixed(1),
                                                },
                                              ];
                                              return (
                                                <div
                                                  key={`val-${y}`}
                                                  className="mt-1 flex flex-wrap gap-1"
                                                >
                                                  {chips.map((c) => (
                                                    <span
                                                      key={c.label}
                                                      className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700"
                                                    >
                                                      {c.label}: {c.value}
                                                    </span>
                                                  ))}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      } else if (hasYearly) {
                                        // Show simple yearly targets for corporate KPIs
                                        return (
                                          <div className="flex flex-wrap gap-1">
                                            {yearlyYears.map((y) => (
                                              <div
                                                key={y}
                                                className="flex items-center gap-2"
                                              >
                                                <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700">
                                                  {y}:{" "}
                                                  {Number(totals[y]).toFixed(1)}
                                                </span>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {weightTypeLabels[
                                                    kpi.unitType as keyof typeof weightTypeLabels
                                                  ] || "Unknown"}
                                                </Badge>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      } else {
                                        // Fallback
                                        return (
                                          <span className="text-gray-400 italic text-xs">
                                            No targets configured
                                          </span>
                                        );
                                      }
                                    })()
                                  ) : (
                                    <span className="text-gray-400 italic text-xs">
                                      No targets
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <Badge
                                    className={`${
                                      statusMap[kpi.status].color
                                    } rounded-full px-2 py-1 text-xs font-medium border-0`}
                                  >
                                    {statusMap[kpi.status].label}
                                  </Badge>
                                </td>
                                {showReasonColumn && (
                                  <td className="py-2 px-3">
                                    {kpi.status === "REJECTED" ? (
                                      <span className="text-xs text-red-600 italic">
                                        {kpiRejectionReasons?.[kpi.kpiId] ||
                                          "No reason provided"}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">
                                        -
                                      </span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Show message when expanded but no KPIs */}
              {expanded === obj.objectiveId && objectiveKPIs.length === 0 && (
                <TableRow className="bg-gray-50">
                  <TableCell
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No KPIs have been added to this objective yet.
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <>
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        {enableSorting ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={objectiveIds}
              strategy={verticalListSortingStrategy}
            >
              {tableContent}
            </SortableContext>
            <DragOverlay>
              {activeObjective ? (
                <div className="bg-white shadow-lg rounded-lg border-2 border-blue-400 p-4 opacity-90">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {activeObjective.name || "Unnamed Objective"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activeObjective.type} Objective
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          tableContent
        )}
      </div>

      {/* Assign Objective Dialog */}
      {selectedObjectiveForAssignment !== null && (
        <AssignObjectiveDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          objective={selectedObjectiveForAssignment}
          kpis={getKPIsForObjective(selectedObjectiveForAssignment.objectiveId)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </>
  );
};

export default ObjectiveTable;
