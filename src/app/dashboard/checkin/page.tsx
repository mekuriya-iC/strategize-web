"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_CHECKINOUT_SESSIONS, GET_CHECKINOUT_TASKS } from "@/lib/graphql/queries/checkins";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { CheckInTable } from "@/components/checkin/CheckInTable";
import { AddTaskDialog } from "@/components/checkin/AddTaskDialog";
import { FilterDialog, FilterState } from "@/components/checkin/FilterDialog";
import CreateSessionDialog from "@/components/checkin/CreateSessionDialog";
import SessionListView from "@/components/checkin/SessionListView";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchIcon, FilterIcon, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper function to map backend task to frontend format
const mapTaskToFrontend = (task: any) => ({
  id: task.checkinoutTaskId,
  taskType: task.taskLinkType,
  task: task.taskTitle,
  description: task.plannedDescription || "",
  relatedTo: task.relatedTo?.fullName || "",
  startTime: task.taskStartDate,
  endTime: task.taskEndDate,
  checkoutStatus: task.taskStatus,
  attachment: task.evidenceUrl || null,
  remark: task.challenges || "",
  isKpiMet: task.taskLinkType === "KPI_FULFILLED",
  isInitiativeMet: task.taskLinkType === "INITIATIVE_FULFILLED",
  isSelfDevComplete: task.taskLinkType === "SELF_DEVELOPMENT",
  createdAt: task.createdAt,
  isMidWeekTask: false, // TODO: Calculate based on creation date
  achievedDescription: task.achievedDescription || "",
  nextSteps: task.nextSteps || "",
});

export default function CheckInPage() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTask, setEditingTask] = useState<any>(null);

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

  // Get check-in sessions for current user
  const { data, loading, refetch } = useQuery(GET_CHECKINOUT_SESSIONS, {
    variables: {
      employeeUserId: currentUser?.employeeId,
      limit: 100,
      page: 1,
    },
    skip: !currentUser?.employeeId,
  });

  const sessions = data?.checkinoutSessions?.items || [];

  // Auto-select first session or use selected session
  const currentSession = useMemo(() => {
    if (selectedSessionId) {
      return sessions.find((s: any) => s.checkinoutSessionId === selectedSessionId);
    }
    return sessions[0] || null;
  }, [sessions, selectedSessionId]);

  // Get current week's check-in data
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

  // Get tasks for the current session
  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useQuery(GET_CHECKINOUT_TASKS, {
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
    const midWeekTaskCount = currentWeekDataWithTasks.tasks?.filter((task: any) => task.isMidWeekTask).length || 0;
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

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!currentWeekDataWithTasks?.tasks) {
      return {
        totalTasks: 0,
        kpiMet: 0,
        kpiUnmet: 0,
        kpiMetPercentage: 0,
        kpiUnmetPercentage: 0,
      };
    }

    const tasks = currentWeekDataWithTasks.tasks;
    const totalTasks = tasks.length;
    const kpiMet = tasks.filter((task: any) => 
      task.taskLinkType === "KPI_FULFILLED" || task.taskStatus === "DONE"
    ).length;
    const kpiUnmet = totalTasks - kpiMet;

    return {
      totalTasks,
      kpiMet,
      kpiUnmet,
      kpiMetPercentage: totalTasks > 0 ? Math.round((kpiMet / totalTasks) * 100) : 0,
      kpiUnmetPercentage: totalTasks > 0 ? Math.round((kpiUnmet / totalTasks) * 100) : 0,
    };
  }, [currentWeekDataWithTasks]);

  const hasCheckins = currentWeekDataWithTasks && currentWeekDataWithTasks.tasks?.length > 0;
  const midWeekTaskCount = currentWeekDataWithTasks?.tasks?.filter((task: any) => task.isMidWeekTask).length || 0;

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
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedSessionId(null);
  };

  // Show session list view
  if (view === 'list') {
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
            refetch();
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

          {sessions.length > 1 && (
            <Select
              value={currentSession?.checkinoutSessionId || ''}
              onValueChange={(value) => setSelectedSessionId(value)}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select session..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session: any, index: number) => (
                  <SelectItem key={session.checkinoutSessionId} value={session.checkinoutSessionId}>
                    Sprint {index + 1} - Week of {new Date(session.weekStartDate).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Original Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Check In/Out - Current Week(Active)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentWeekDataWithTasks && (
              <>
                Week: {new Date(currentWeekDataWithTasks.createdAt).toLocaleDateString()} - {new Date(currentWeekDataWithTasks.endDate).toLocaleDateString()}
              </>
            )}
          </p>
        </div>
      </div>

      {loading || tasksLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
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
              <rect x="120" y="160" width="60" height="80" rx="5" fill="#5B5BF7" />
              <rect x="110" y="180" width="20" height="60" rx="5" fill="#5B5BF7" />
              <rect x="170" y="180" width="20" height="60" rx="5" fill="#5B5BF7" />
              <text x="100" y="100" fontSize="30" fill="#BDBDBD">?</text>
              <text x="190" y="100" fontSize="30" fill="#BDBDBD">?</text>
              <rect x="50" y="220" width="30" height="40" rx="3" fill="#4ADE80" />
              <ellipse cx="65" cy="210" rx="15" ry="20" fill="#22C55E" />
              <rect x="200" y="200" width="50" height="30" rx="3" fill="#E5E7EB" />
              <rect x="210" y="190" width="10" height="15" rx="2" fill="#9CA3AF" />
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
            onClick={() => setIsAddTaskOpen(true)}
            className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add a Task
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</span>
                <span className="text-xs text-gray-500">This Week</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalTasks}
                </span>
                <span className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded mb-1">
                  +100%
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">KPI Met Tasks</span>
                <span className="text-xs text-gray-500">This Week</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics.kpiMet}
                </span>
                <span className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded mb-1">
                  +{statistics.kpiMetPercentage}%
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">KPI Unmet Tasks</span>
                <span className="text-xs text-gray-500">This Week</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics.kpiUnmet}
                </span>
                <span className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded mb-1">
                  +{statistics.kpiUnmetPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Tasks Header with Search and Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
                <span className="text-sm text-gray-500">
                  Last Week (18 Oct - 22 Oct)
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
                  variant="outline"
                  size="sm"
                  className="gap-2 relative"
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
            tasks={currentWeekDataWithTasks.tasks || []}
            createdDate={new Date(currentWeekDataWithTasks.createdAt)}
            searchQuery={searchQuery}
            onRefetch={() => {
              refetch();
              refetchTasks();
            }}
            onEditTask={handleEditTask}
            filters={filters}
          />

          {/* Add Mid Week Task Button */}
          {showMidWeekButton && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => setIsAddTaskOpen(true)}
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

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={isAddTaskOpen}
        onOpenChange={(open) => {
          setIsAddTaskOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSuccess={() => {
          refetch();
          refetchTasks();
          setIsAddTaskOpen(false);
          setEditingTask(null);
        }}
        sessionId={currentWeekDataWithTasks?.id}
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
