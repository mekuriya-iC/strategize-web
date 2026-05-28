"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CHECKINOUT_SESSIONS,
  GET_CHECKINOUT_TASKS,
} from "@/lib/graphql/queries/checkins";
import { CREATE_CHECKINOUT_SESSION } from "@/lib/graphql/mutations/checkins";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { CheckInTable } from "@/components/checkin/CheckInTable";
import { AddTaskDialog } from "@/components/checkin/AddTaskDialog";
import { FilterDialog, FilterState } from "@/components/checkin/FilterDialog";
import CreateSessionDialog from "@/components/checkin/CreateSessionDialog";
import SessionListView from "@/components/checkin/SessionListView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown,
  ChevronUp,
  Users,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  ArrowLeft,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// Helper function to map backend task to frontend format
const mapTaskToFrontend = (task: any) => ({
  id: task.checkinoutTaskId,
  taskType: task.taskLinkType,
  task: task.taskTitle,
  description: task.plannedDescription || "",
  relatedTo: task.relatedTo?.fullName || "",
  relatedToEmployeeId: task.relatedTo?.employeeId || "",
  linkedKpiId: task.linkedKpiId || "",
  linkedKpiName: task.linkedKpi?.name || "",
  linkedInitiativeId: task.linkedInitiativeId || "",
  linkedInitiativeName: task.linkedInitiative?.title || "",
  startTime: task.taskStartDate,
  endTime: task.taskEndDate,
  checkoutStatus: task.taskStatus,
  requiresApproval: task.requiresApproval || false,
  approvedAt: task.approvedAt || null,
  attachment: task.evidenceUrl || null,
  remark: task.challenges || "",
  isKpiMet: task.taskLinkType === "KPI_FULFILLED",
  isInitiativeMet: task.taskLinkType === "INITIATIVE_FULFILLED",
  isSelfDevComplete: task.taskLinkType === "SELF_DEVELOPMENT",
  createdAt: task.createdAt,
  isMidWeekTask: false,
  achievedDescription: task.achievedDescription || "",
  nextSteps: task.nextSteps || "",
});

function EmployeeTaskCard({
  session,
  isExpanded,
  onToggle,
  onEditTask,
  onAddTask,
  onTasksSummary,
  currentUser,
  searchQuery,
  filters,
}: any) {
  const {
    data: tasksData,
    loading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery(GET_CHECKINOUT_TASKS, {
    variables: {
      sessionId: session.checkinoutSessionId,
      limit: 100,
      page: 1,
    },
    skip: !session.checkinoutSessionId,
  });

  const tasks = useMemo(() => {
    if (!tasksData?.checkinoutTasks?.items) return [];
    return tasksData.checkinoutTasks.items.map(mapTaskToFrontend);
  }, [tasksData]);

  useEffect(() => {
    if (!onTasksSummary || !session?.checkinoutSessionId) return;
    const totalTasks = tasks.length;
    const kpiMet = tasks.filter(
      (task: any) =>
        task.taskType === "KPI_FULFILLED" || task.checkoutStatus === "DONE",
    ).length;
    const kpiUnmet = totalTasks - kpiMet;
    onTasksSummary(session.checkinoutSessionId, {
      totalTasks,
      kpiMet,
      kpiUnmet,
    });
  }, [onTasksSummary, session?.checkinoutSessionId, tasks]);

  const isCurrentUser =
    session.employee?.employeeId === currentUser?.employeeId;
  const isManagerOfThisEmployee =
    session.supervisor?.employeeId === currentUser?.employeeId;
  // Permission rule:
  // - Employees can edit/delete only their own tasks
  // - Supervisors/session creators can view team tasks but cannot edit/delete them
  // (Backend also enforces this.)
  const canEdit = isCurrentUser; // kept for readability if needed later

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 overflow-hidden mb-6 shadow-sm",
        isExpanded
          ? "ring-1 ring-[#3838EC]/30 border-[#3838EC]/20 shadow-md"
          : "border-gray-200 dark:border-gray-700 hover:border-[#3838EC]/30 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "p-5 flex items-center justify-between cursor-pointer group",
          isExpanded
            ? "bg-[#3838EC]/5 dark:bg-[#3838EC]/10"
            : "hover:bg-gray-50/50 dark:hover:bg-gray-700/30",
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-700 shadow-sm">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-gradient-to-br from-[#3838EC] to-[#5B5BF7] text-white font-bold">
                {session.employee?.fullName
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm",
                session.overallStatus === "ACTIVE"
                  ? "bg-green-500"
                  : "bg-gray-400",
              )}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {session.employee?.fullName}
              </h3>
              {isCurrentUser && (
                <Badge className="bg-[#3838EC] text-white text-[10px] font-bold px-1.5 py-0 h-4 uppercase tracking-wider">
                  Me
                </Badge>
              )}
              {isManagerOfThisEmployee && !isCurrentUser && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 border-[#3838EC] text-[#3838EC] bg-[#3838EC]/5 font-bold uppercase tracking-wider"
                >
                  My Team
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {session.employee?.title || "Team Member"}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="font-medium text-[#3838EC] dark:text-[#5B5BF7]">
                {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-2">
            {isCurrentUser && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTask(session.checkinoutSessionId);
                }}
                className="h-9 px-3 text-[#3838EC] hover:bg-[#3838EC]/10 font-bold gap-2 rounded-lg border border-[#3838EC]/20 shadow-sm"
              >
                <PlusIcon className="w-4 h-4" />
                Add My Task
              </Button>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge
              className={cn(
                "font-bold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-tighter",
                session.overallStatus === "COMPLETED"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : session.overallStatus === "ACTIVE"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200",
              )}
            >
              {session.overallStatus}
            </Badge>
          </div>

          <div
            className={cn(
              "p-2 rounded-full transition-colors",
              isExpanded
                ? "bg-[#3838EC]/10 text-[#3838EC]"
                : "text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-700",
            )}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white dark:bg-gray-800">
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/10">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase tracking-widest">
              <div className="w-1 h-4 bg-[#3838EC] rounded-full" />
              Session Tasks
            </h4>
            {isCurrentUser && (
              <span className="text-[11px] text-gray-500 font-medium">
                You can add, edit or delete your tasks here
              </span>
            )}
            {isManagerOfThisEmployee && !isCurrentUser && (
              <span className="text-[11px] text-gray-500 font-medium">
                You can view your team’s tasks here. Only employees can edit or
                delete their own tasks.
              </span>
            )}
          </div>

          <div className="p-0 overflow-x-auto">
            {tasksLoading ? (
              <div className="p-12 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#3838EC] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                  role="status"
                >
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                    Loading...
                  </span>
                </div>
                <p className="mt-4 text-sm text-gray-500 font-medium">
                  Fetching tasks...
                </p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h5 className="text-gray-900 dark:text-white font-semibold mb-1">
                  No tasks found
                </h5>
                <p className="text-sm text-gray-500">
                  This employee hasn't added any tasks to this session yet.
                </p>
              </div>
            ) : (
              <CheckInTable
                tasks={tasks}
                createdDate={new Date(session.weekStartDate)}
                endDate={new Date(session.weekEndDate)}
                searchQuery={searchQuery}
                onRefetch={refetchTasks}
                onEditTask={onEditTask}
                filters={filters}
                isEditable={isCurrentUser}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTask, setEditingTask] = useState<any>(null);
  const [teamTaskSummaries, setTeamTaskSummaries] = useState<
    Record<string, { totalTasks: number; kpiMet: number; kpiUnmet: number }>
  >({});
  const handleTasksSummary = useCallback((sessionId: string, summary: any) => {
    setTeamTaskSummaries((prev) => {
      const existing = prev[sessionId];
      if (
        existing &&
        existing.totalTasks === summary.totalTasks &&
        existing.kpiMet === summary.kpiMet &&
        existing.kpiUnmet === summary.kpiUnmet
      ) {
        return prev;
      }
      return { ...prev, [sessionId]: summary };
    });
  }, []);

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsAddTaskOpen(true);
  };
  const [filters, setFilters] = useState<FilterState>({
    objective: "",
    startDate: undefined,
    endDate: undefined,
    attachment: "all",
    checkoutStatus: [],
  });

  // Get current user
  const { data: userData } = useQuery(GET_ME);
  const currentUser = userData?.me;

  const [createMySession, { loading: creatingMySession }] = useMutation(
    CREATE_CHECKINOUT_SESSION,
  );

  // Get check-in sessions for current user (as employee)
  const {
    data: employeeData,
    loading: employeeLoading,
    refetch: refetchEmployeeSessions,
  } = useQuery(GET_CHECKINOUT_SESSIONS, {
    variables: {
      employeeUserId: currentUser?.employeeId,
      limit: 100,
      page: 1,
    },
    skip: !currentUser?.employeeId,
  });

  // Get check-in sessions where current user is supervisor
  const {
    data: supervisorData,
    loading: supervisorLoading,
    refetch: refetchSupervisorSessions,
  } = useQuery(GET_CHECKINOUT_SESSIONS, {
    variables: {
      supervisorUserId: currentUser?.employeeId,
      limit: 100,
      page: 1,
    },
    skip: !currentUser?.employeeId,
  });

  const employeeSessions = employeeData?.checkinoutSessions?.items || [];
  const supervisedSessions = supervisorData?.checkinoutSessions?.items || [];

  // Combine all relevant sessions for the list view
  const allSessions = useMemo(() => {
    const byId = new Map<string, any>();
    for (const session of employeeSessions) {
      if (
        session?.checkinoutSessionId &&
        !byId.has(session.checkinoutSessionId)
      ) {
        byId.set(session.checkinoutSessionId, session);
      }
    }
    for (const session of supervisedSessions) {
      if (
        session?.checkinoutSessionId &&
        !byId.has(session.checkinoutSessionId)
      ) {
        byId.set(session.checkinoutSessionId, session);
      }
    }
    return Array.from(byId.values());
  }, [employeeSessions, supervisedSessions]);

  // Current session logic
  const currentSession = useMemo(() => {
    if (selectedSessionId) {
      return allSessions.find(
        (s: any) => s.checkinoutSessionId === selectedSessionId,
      );
    }
    return employeeSessions[0] || supervisedSessions[0] || null;
  }, [allSessions, employeeSessions, supervisedSessions, selectedSessionId]);

  // isManagerMode: True if the current user is the supervisor of the current session
  // or if they have supervised sessions for this week.
  const isManagerMode = useMemo(() => {
    if (!currentSession || !currentUser) return false;
    return (
      currentSession.supervisor?.employeeId === currentUser.employeeId ||
      supervisedSessions.length > 0
    );
  }, [currentSession, currentUser, supervisedSessions]);

  // Helper to normalize dates for comparison (ignoring time components)
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  // Find all team sessions for the same week as currentSession
  const teamSessions = useMemo(() => {
    if (!currentSession || !currentUser) return [];

    const weekStart = normalizeDate(currentSession.weekStartDate);

    // 1. Get all sessions supervised by the current user for this week
    const supervisedThisWeek = supervisedSessions.filter(
      (s: any) => normalizeDate(s.weekStartDate) === weekStart,
    );

    // 2. Get the current user's own session for this week (even if their supervisor is different)
    const myOwnSession = employeeSessions.find(
      (s: any) => normalizeDate(s.weekStartDate) === weekStart,
    );

    // Combine them, ensuring the current user's session is at the top
    const combined = [...supervisedThisWeek];
    if (
      myOwnSession &&
      !combined.find(
        (s) => s.checkinoutSessionId === myOwnSession.checkinoutSessionId,
      )
    ) {
      combined.unshift(myOwnSession);
    }

    return combined;
  }, [supervisedSessions, employeeSessions, currentSession, currentUser]);

  useEffect(() => {
    const activeSessionIds = new Set(
      teamSessions.map((s: any) => s.checkinoutSessionId).filter(Boolean),
    );
    setTeamTaskSummaries((prev) => {
      const next: Record<
        string,
        { totalTasks: number; kpiMet: number; kpiUnmet: number }
      > = {};
      for (const [sessionId, summary] of Object.entries(prev)) {
        if (activeSessionIds.has(sessionId)) next[sessionId] = summary;
      }
      
      // Only update if there's an actual change
      const prevKeys = Object.keys(prev).sort();
      const nextKeys = Object.keys(next).sort();
      if (
        prevKeys.length === nextKeys.length &&
        prevKeys.every((key, i) => key === nextKeys[i])
      ) {
        return prev; // No change, return previous state to avoid re-render
      }
      
      return next;
    });
  }, [teamSessions]);

  // Get the manager's own session ID for this week to allow "Add My Task"
  const mySessionId = useMemo(() => {
    if (!currentSession || !currentUser || !employeeSessions.length)
      return null;

    const weekStart = normalizeDate(currentSession.weekStartDate);

    const mySession = employeeSessions.find(
      (s: any) => normalizeDate(s.weekStartDate) === weekStart,
    );

    return mySession?.checkinoutSessionId || null;
  }, [employeeSessions, currentSession, currentUser]);

  // Group tasks by session (employee)
  const [expandedSessions, setExpandedSessions] = useState<
    Record<string, boolean>
  >({});

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  // Get current week's check-in data (legacy support for single view)
  const currentWeekData = useMemo(() => {
    if (!currentSession) return null;

    return {
      id: currentSession.checkinoutSessionId,
      createdAt: currentSession.weekStartDate,
      endDate: currentSession.weekEndDate,
      status: currentSession.overallStatus,
      tasks: [], // Tasks will be loaded separately
    };
  }, [currentSession]);

  // Fetch tasks for all team sessions
  // In a real app, we'd use a separate component for each card to fetch its own tasks
  // For now, let's keep it simple and fetch the selected one, plus provide a way to see others.

  // Actually, let's create a sub-component for the Employee Card to handle its own task fetching.

  // Update refetch to handle both
  const refetchAll = () => {
    refetchEmployeeSessions();
    refetchSupervisorSessions();
  };

  // Get tasks for the current session
  const {
    data: tasksData,
    loading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery(GET_CHECKINOUT_TASKS, {
    variables: {
      sessionId: currentWeekData?.id,
      limit: 100,
      page: 1,
    },
    skip: !currentWeekData?.id,
  });

  // Map tasks to frontend format
  const tasks = useMemo(() => {
    if (!tasksData?.checkinoutTasks?.items) return [];
    return tasksData.checkinoutTasks.items.map(mapTaskToFrontend);
  }, [tasksData]);

  // Update currentWeekData with tasks
  const currentWeekDataWithTasks = useMemo(() => {
    if (!currentWeekData) return null;
    return {
      ...currentWeekData,
      tasks,
    };
  }, [currentWeekData, tasks]);

  // Calculate if we can add mid-week tasks
  const canAddMidWeekTask = useMemo(() => {
    if (!currentWeekDataWithTasks) return false;

    const createdDate = new Date(currentWeekDataWithTasks.createdAt);
    const today = new Date();
    const createdDay = createdDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDay = today.getDay();

    // Not on creation day (Monday) and not Saturday (6)
    const isNotCreationDay = currentDay !== createdDay;
    const isNotSaturday = currentDay !== 6;

    // Count mid-week tasks
    const midWeekTaskCount =
      currentWeekDataWithTasks.tasks?.filter((task: any) => task.isMidWeekTask)
        .length || 0;
    const hasRoomForMore = midWeekTaskCount < 3;

    return isNotCreationDay && isNotSaturday && hasRoomForMore;
  }, [currentWeekDataWithTasks]);

  // Show mid-week button (visible Tuesday-Friday)
  const showMidWeekButton = useMemo(() => {
    if (!currentWeekDataWithTasks) return false;

    const createdDate = new Date(currentWeekDataWithTasks.createdAt);
    const today = new Date();
    const createdDay = createdDate.getDay();
    const currentDay = today.getDay();

    return currentDay !== createdDay && currentDay !== 6;
  }, [currentWeekDataWithTasks]);

  // Calculate team-wide statistics for managers
  const teamStatistics = useMemo(() => {
    if (!isManagerMode || !teamSessions.length) return null;

    let completedSessions = 0;

    // Note: This only counts sessions, not individual tasks because tasks are loaded in cards
    // To get real task counts, we'd need to fetch all tasks for the week
    teamSessions.forEach((s: any) => {
      if (s.overallStatus === "COMPLETED") completedSessions++;
    });

    return {
      teamSize: teamSessions.length,
      completedSessions,
      completionRate: Math.round(
        (completedSessions / teamSessions.length) * 100,
      ),
    };
  }, [isManagerMode, teamSessions]);

  const teamAggregatedStats = useMemo(() => {
    if (!isManagerMode || !teamSessions.length) return null;
    let totalTasks = 0;
    let kpiMet = 0;
    let kpiUnmet = 0;
    for (const session of teamSessions) {
      const sessionId = session?.checkinoutSessionId;
      if (!sessionId) continue;
      const summary = teamTaskSummaries[sessionId];
      if (!summary) continue;
      totalTasks += summary.totalTasks;
      kpiMet += summary.kpiMet;
      kpiUnmet += summary.kpiUnmet;
    }
    return {
      totalTasks,
      kpiMet,
      kpiUnmet,
      kpiMetPercentage:
        totalTasks > 0 ? Math.round((kpiMet / totalTasks) * 100) : 0,
      kpiUnmetPercentage:
        totalTasks > 0 ? Math.round((kpiUnmet / totalTasks) * 100) : 0,
    };
  }, [isManagerMode, teamSessions, teamTaskSummaries]);

  const statistics = useMemo(() => {
    if (isManagerMode && teamAggregatedStats) return teamAggregatedStats;
    const currentTasks = currentWeekDataWithTasks?.tasks || [];
    const totalTasks = currentTasks.length;
    const kpiMet = currentTasks.filter(
      (task: any) =>
        task.taskType === "KPI_FULFILLED" || task.checkoutStatus === "DONE",
    ).length;
    const kpiUnmet = totalTasks - kpiMet;
    return {
      totalTasks,
      kpiMet,
      kpiUnmet,
      kpiMetPercentage:
        totalTasks > 0 ? Math.round((kpiMet / totalTasks) * 100) : 0,
      kpiUnmetPercentage:
        totalTasks > 0 ? Math.round((kpiUnmet / totalTasks) * 100) : 0,
    };
  }, [currentWeekDataWithTasks, isManagerMode, teamAggregatedStats]);

  // Force open the add task modal with a specific session ID
  const handleOpenAddTask = (sessionId: string | null) => {
    if (!sessionId) {
      toast.error("Could not determine the session for this task.");
      return;
    }
    setTargetSessionId(sessionId);
    setIsAddTaskOpen(true);
  };

  const handleAddMyTaskClick = async () => {
    if (mySessionId) {
      handleOpenAddTask(mySessionId);
      return;
    }

    const employeeId = currentUser?.employeeId;
    const strategicPeriodId =
      currentSession?.strategicPeriod?.strategicPeriodId;
    const weekStartDate = currentSession?.weekStartDate;
    const weekEndDate = currentSession?.weekEndDate;

    if (!employeeId || !strategicPeriodId || !weekStartDate || !weekEndDate) {
      toast.error("Could not determine the session for this task.");
      return;
    }

    try {
      const weekStart = normalizeDate(weekStartDate);
      const preflight = await refetchEmployeeSessions();
      const preflightItems = preflight.data?.checkinoutSessions?.items || [];
      const existingSessionId =
        preflightItems.find(
          (s: any) => normalizeDate(s.weekStartDate) === weekStart,
        )?.checkinoutSessionId || null;

      if (existingSessionId) {
        handleOpenAddTask(existingSessionId);
        return;
      }

      await createMySession({
        variables: {
          input: {
            employeeUserId: employeeId,
            supervisorUserId: employeeId,
            strategicPeriodId,
            weekStartDate,
            weekEndDate,
            title: currentSession?.title || undefined,
          },
        },
      });

      const refreshed = await refetchEmployeeSessions();
      const refreshedItems = refreshed.data?.checkinoutSessions?.items || [];
      const createdSessionId =
        refreshedItems.find(
          (s: any) => normalizeDate(s.weekStartDate) === weekStart,
        )?.checkinoutSessionId || null;

      if (!createdSessionId) {
        toast.error("Could not determine the session for this task.");
        return;
      }

      handleOpenAddTask(createdSessionId);
    } catch (error: any) {
      const refreshed = await refetchEmployeeSessions();
      const refreshedItems = refreshed.data?.checkinoutSessions?.items || [];
      const weekStart = normalizeDate(weekStartDate);
      const existingSessionId =
        refreshedItems.find(
          (s: any) => normalizeDate(s.weekStartDate) === weekStart,
        )?.checkinoutSessionId || null;

      if (existingSessionId) {
        handleOpenAddTask(existingSessionId);
        return;
      }

      const message = error?.message || "Failed to create your session.";
      toast.error(message);
    }
  };

  const hasCheckins =
    currentWeekDataWithTasks && currentWeekDataWithTasks.tasks?.length > 0;
  const midWeekTaskCount =
    currentWeekDataWithTasks?.tasks?.filter((task: any) => task.isMidWeekTask)
      .length || 0;

  // Count active filters
  const activeFiltersCount = [
    filters.objective,
    filters.startDate,
    filters.endDate,
    filters.attachment !== "all",
    filters.checkoutStatus.length > 0,
  ].filter(Boolean).length;

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedSessionId(null);
  };

  // Show session list view
  if (view === "list") {
    return (
      <div className="h-full">
        <SessionListView
          currentUser={currentUser}
          onCreateSession={() => setIsCreateSessionOpen(true)}
          onSelectSession={handleSelectSession}
        />

        {/* Create Session Dialog */}
        <CreateSessionDialog
          open={isCreateSessionOpen}
          onOpenChange={setIsCreateSessionOpen}
          currentUserId={currentUser?.employeeId}
          onSuccess={() => {
            refetchAll();
          }}
        />
      </div>
    );
  }

  // Show session detail view (existing check-in page)
  return (
    <div className="h-full flex flex-col">
      {/* Header with Back Button and Session Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sessions
          </Button>

          {allSessions.length > 1 && (
            <Select
              value={currentSession?.checkinoutSessionId || ""}
              onValueChange={(value) => setSelectedSessionId(value)}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select session..." />
              </SelectTrigger>
              <SelectContent>
                {allSessions.map((session: any) => (
                  <SelectItem
                    key={session.checkinoutSessionId}
                    value={session.checkinoutSessionId}
                  >
                    {session.employee?.fullName} - Week of{" "}
                    {new Date(session.weekStartDate).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isManagerMode && (
          <Button
            onClick={handleAddMyTaskClick}
            disabled={creatingMySession}
            className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white gap-2 shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            {creatingMySession ? "Preparing..." : "Add My Task"}
          </Button>
        )}
      </div>

      {/* Original Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Check In/Out - Current Week(Active)
            {isManagerMode && (
              <Badge className="bg-[#3838EC]/10 text-[#3838EC] border-[#3838EC]/20 gap-1">
                <Users className="w-3 h-3" /> Team View
              </Badge>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentSession && (
              <>
                Week:{" "}
                {new Date(currentSession.weekStartDate).toLocaleDateString()} -{" "}
                {new Date(currentSession.weekEndDate).toLocaleDateString()}
              </>
            )}
          </p>
        </div>
      </div>

      {employeeLoading || supervisorLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Total Tasks / Team Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl group-hover:bg-[#3838EC] group-hover:text-white transition-colors duration-300">
                  <Target className="w-6 h-6 text-[#3838EC] group-hover:text-white" />
                </div>
                <Badge
                  variant="outline"
                  className="bg-blue-50/50 text-[#3838EC] border-blue-100"
                >
                  {isManagerMode ? "Team Overview" : "Personal"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {isManagerMode ? "Total Team Tasks" : "Total Tasks"}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {statistics.totalTasks}
                  </h3>
                  <span className="text-sm font-semibold text-green-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Live
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Current Sprint Activity
                </span>
                {isManagerMode && teamStatistics && (
                  <span className="font-bold text-[#3838EC]">
                    {teamStatistics.teamSize} Members
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: KPI Met / Completion Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                  <CheckCircle2 className="w-6 h-6 text-green-600 group-hover:text-white" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-green-600">
                    {statistics.kpiMetPercentage}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  KPIs Fulfilled
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {statistics.kpiMet}
                  </h3>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${statistics.kpiMetPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-400 font-medium">
                {isManagerMode && teamStatistics ? (
                  <>
                    <span>Team Completion</span>
                    <span className="text-green-600 font-bold">
                      {teamStatistics.completedSessions}/
                      {teamStatistics.teamSize}
                    </span>
                  </>
                ) : (
                  "Tasks marked as Done or Met"
                )}
              </div>
            </div>

            {/* Card 3: Remaining / In Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                  <AlertCircle className="w-6 h-6 text-amber-500 group-hover:text-white" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-amber-500">
                    {statistics.kpiUnmetPercentage}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Pending / Unmet
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {statistics.kpiUnmet}
                  </h3>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                    <div
                      className="h-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${statistics.kpiUnmetPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
                <span>Action Required</span>
                <span className="text-amber-500 font-bold">Needs Checkout</span>
              </div>
            </div>
          </div>

          {isManagerMode ? (
            <div className="flex-1 flex flex-col">
              {/* Team View Search and Filter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 md:w-64">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search name, major task..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleAddMyTaskClick}
                    disabled={creatingMySession}
                    className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white px-4 h-9 rounded-lg flex items-center gap-2 shadow-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {creatingMySession ? "Preparing..." : "Add My Task"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 relative h-9"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <FilterIcon className="w-4 h-4" />
                    Filter
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-[#3838EC] text-white text-xs rounded-full">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Employee Cards */}
              <div className="space-y-4">
                {teamSessions.map((session: any) => (
                  <EmployeeTaskCard
                    key={session.checkinoutSessionId}
                    session={session}
                    isExpanded={
                      expandedSessions[session.checkinoutSessionId] ??
                      session.employee?.employeeId === currentUser?.employeeId
                    }
                    onToggle={() => toggleSession(session.checkinoutSessionId)}
                    onEditTask={handleEditTask}
                    onAddTask={(sid: string) => handleOpenAddTask(sid)}
                    onTasksSummary={handleTasksSummary}
                    currentUser={currentUser}
                    searchQuery={searchQuery}
                    filters={filters}
                  />
                ))}
              </div>
            </div>
          ) : !hasCheckins ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Empty State Illustration */}
              <div className="mb-8">
                <svg
                  width="300"
                  height="300"
                  viewBox="0 0 300 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-80"
                >
                  <circle cx="150" cy="120" r="40" fill="#E0E7FF" />
                  <circle cx="140" cy="115" r="5" fill="#3838EC" />
                  <circle cx="160" cy="115" r="5" fill="#3838EC" />
                  <path
                    d="M140 130 Q150 135 160 130"
                    stroke="#3838EC"
                    strokeWidth="2"
                    fill="none"
                  />
                  <rect
                    x="120"
                    y="160"
                    width="60"
                    height="80"
                    rx="5"
                    fill="#5B5BF7"
                  />
                  <rect
                    x="110"
                    y="180"
                    width="20"
                    height="60"
                    rx="5"
                    fill="#5B5BF7"
                  />
                  <rect
                    x="170"
                    y="180"
                    width="20"
                    height="60"
                    rx="5"
                    fill="#5B5BF7"
                  />
                  <text x="100" y="100" fontSize="30" fill="#BDBDBD">
                    ?
                  </text>
                  <text x="190" y="100" fontSize="30" fill="#BDBDBD">
                    ?
                  </text>
                  <rect
                    x="50"
                    y="220"
                    width="30"
                    height="40"
                    rx="3"
                    fill="#4ADE80"
                  />
                  <ellipse cx="65" cy="210" rx="15" ry="20" fill="#22C55E" />
                  <rect
                    x="200"
                    y="200"
                    width="50"
                    height="30"
                    rx="3"
                    fill="#E5E7EB"
                  />
                  <rect
                    x="210"
                    y="190"
                    width="10"
                    height="15"
                    rx="2"
                    fill="#9CA3AF"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                It seems you don't have added any check in/out
              </h2>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                tasks yet
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                Start adding tasks with the button below
              </p>

              <Button
                onClick={() => {
                  setTargetSessionId(
                    currentSession?.checkinoutSessionId || null,
                  );
                  setIsAddTaskOpen(true);
                }}
                className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-lg"
              >
                <PlusIcon className="w-4 h-4" />
                Add a Task
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Tasks Header with Search and Filter */}
              <div className="bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Tasks
                    </h2>
                    <span className="text-sm text-gray-500">
                      Session Overview
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:w-64">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search name, major task..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        setTargetSessionId(
                          currentSession?.checkinoutSessionId || null,
                        );
                        setIsAddTaskOpen(true);
                      }}
                      className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white px-4 h-9 rounded-lg flex items-center gap-2 shadow-sm"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add a Task
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 relative h-9"
                      onClick={() => setIsFilterOpen(true)}
                    >
                      <FilterIcon className="w-4 h-4" />
                      Filter
                      {activeFiltersCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-[#3838EC] text-white text-xs rounded-full">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tasks Table */}
              <CheckInTable
                tasks={currentWeekDataWithTasks?.tasks || []}
                createdDate={
                  new Date(
                    currentWeekDataWithTasks?.createdAt ||
                      currentSession.weekStartDate,
                  )
                }
                endDate={new Date(currentSession.weekEndDate)}
                searchQuery={searchQuery}
                onRefetch={() => {
                  refetchAll();
                  refetchTasks();
                }}
                onEditTask={handleEditTask}
                filters={filters}
                isEditable={true}
              />

              {/* Add Mid Week Task Button */}
              {showMidWeekButton && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => {
                      setTargetSessionId(
                        currentSession?.checkinoutSessionId || null,
                      );
                      setIsAddTaskOpen(true);
                    }}
                    disabled={!canAddMidWeekTask}
                    className="bg-white dark:bg-gray-800 border-2 border-dashed border-[#3838EC] text-[#3838EC] hover:bg-[#ECECFF] dark:hover:bg-[#3838EC]/10 px-6 py-2 rounded-lg flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add a Mid Week Task ({midWeekTaskCount}/3)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={isAddTaskOpen}
        onOpenChange={(open) => {
          setIsAddTaskOpen(open);
          if (!open) {
            setEditingTask(null);
            setTargetSessionId(null);
          }
        }}
        onSuccess={() => {
          refetchAll();
          refetchTasks();
          setIsAddTaskOpen(false);
          setEditingTask(null);
          setTargetSessionId(null);
        }}
        sessionId={targetSessionId || undefined}
        editingTask={editingTask}
      />

      {/* Filter Dialog */}
      <FilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </div>
  );
}
