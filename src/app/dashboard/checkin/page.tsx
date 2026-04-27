"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_MY_CHECKINS } from "@/lib/graphql/queries/checkins";
import { CheckInTable } from "@/components/checkin/CheckInTable";
import { AddTaskDialog } from "@/components/checkin/AddTaskDialog";
import { FilterDialog, FilterState } from "@/components/checkin/FilterDialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchIcon, FilterIcon, EyeIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Mock data for preview
const MOCK_DATA = {
  myCheckins: [
    {
      id: "mock-checkin-1",
      createdAt: new Date().toISOString(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      tasks: [
        {
          id: "mock-task-1",
          taskType: "KPI_LINKED",
          task: "Review a Gafat RFP ON Stress Management Training",
          description: "Comprehensive review of the RFP requirements and deliverables",
          relatedTo: "John Doe",
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          checkoutStatus: "NOT_DONE",
          attachment: "proposal.pdf",
          remark: "Priority task for this week",
          isKpiMet: true,
          isInitiativeMet: true,
          isSelfDevComplete: true,
          createdAt: new Date().toISOString(),
          isMidWeekTask: false,
        },
        {
          id: "mock-task-2",
          taskType: "INITIATIVE_LINKED",
          task: "Preparing Technical Proposal FOR Gafat",
          description: "Draft technical approach and methodology",
          relatedTo: "Jane Smith",
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          checkoutStatus: "POSTPONED",
          attachment: null,
          remark: "Waiting for client feedback",
          isKpiMet: false,
          isInitiativeMet: true,
          isSelfDevComplete: false,
          createdAt: new Date().toISOString(),
          isMidWeekTask: false,
        },
        {
          id: "mock-task-3",
          taskType: "UNLINKED",
          task: "Finalize performance report logbook",
          description: "Complete Q4 performance documentation",
          relatedTo: "Team Lead",
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          checkoutStatus: "CANCELLED",
          attachment: null,
          remark: "Moved to next quarter",
          isKpiMet: true,
          isInitiativeMet: false,
          isSelfDevComplete: true,
          createdAt: new Date().toISOString(),
          isMidWeekTask: false,
        },
        {
          id: "mock-task-4",
          taskType: "KPI_LINKED",
          task: "Refine LEAD Proposal LEAD (CORPORATE)",
          description: "Update proposal based on stakeholder feedback",
          relatedTo: "Sarah Johnson",
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          checkoutStatus: "NOT_DONE",
          attachment: "lead_proposal_v2.pdf",
          remark: "Final review pending",
          isKpiMet: true,
          isInitiativeMet: true,
          isSelfDevComplete: true,
          createdAt: new Date().toISOString(),
          isMidWeekTask: false,
        },
      ],
    },
  ],
};

export default function CheckInPage() {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [useMockData, setUseMockData] = useState(false);
  const [mockTasks, setMockTasks] = useState(MOCK_DATA.myCheckins[0].tasks);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    objective: "",
    startDate: undefined,
    endDate: undefined,
    attachment: "all",
    checkoutStatus: [],
  });
  const { data, loading, refetch } = useQuery(GET_MY_CHECKINS);

  // Get current week's check-in data
  const currentWeekData = useMemo(() => {
    if (useMockData) {
      // Return mock data with current tasks state
      return {
        ...MOCK_DATA.myCheckins[0],
        tasks: mockTasks,
      };
    }
    
    if (!data?.myCheckins || data.myCheckins.length === 0) return null;
    
    // For now, get the most recent check-in week
    // In production, filter by current week
    return data.myCheckins[0];
  }, [data, useMockData, mockTasks]);

  // Calculate if we can add mid-week tasks
  const canAddMidWeekTask = useMemo(() => {
    if (!currentWeekData) return false;
    
    const createdDate = new Date(currentWeekData.createdAt);
    const today = new Date();
    const createdDay = createdDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDay = today.getDay();
    
    // Not on creation day (Monday) and not Saturday (6)
    const isNotCreationDay = currentDay !== createdDay;
    const isNotSaturday = currentDay !== 6;
    
    // Count mid-week tasks
    const midWeekTaskCount = currentWeekData.tasks?.filter((task: any) => task.isMidWeekTask).length || 0;
    const hasRoomForMore = midWeekTaskCount < 3;
    
    return isNotCreationDay && isNotSaturday && hasRoomForMore;
  }, [currentWeekData]);

  // Show mid-week button (visible Tuesday-Friday)
  const showMidWeekButton = useMemo(() => {
    if (!currentWeekData) return false;
    
    const createdDate = new Date(currentWeekData.createdAt);
    const today = new Date();
    const createdDay = createdDate.getDay();
    const currentDay = today.getDay();
    
    return currentDay !== createdDay && currentDay !== 6;
  }, [currentWeekData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!currentWeekData?.tasks) {
      return {
        totalTasks: 0,
        kpiMet: 0,
        kpiUnmet: 0,
        kpiMetPercentage: 0,
        kpiUnmetPercentage: 0,
      };
    }

    const tasks = currentWeekData.tasks;
    const totalTasks = tasks.length;
    const kpiMet = tasks.filter((task: any) => task.isKpiMet).length;
    const kpiUnmet = totalTasks - kpiMet;

    return {
      totalTasks,
      kpiMet,
      kpiUnmet,
      kpiMetPercentage: totalTasks > 0 ? Math.round((kpiMet / totalTasks) * 100) : 0,
      kpiUnmetPercentage: totalTasks > 0 ? Math.round((kpiUnmet / totalTasks) * 100) : 0,
    };
  }, [currentWeekData]);

  const hasCheckins = currentWeekData && currentWeekData.tasks?.length > 0;
  const midWeekTaskCount = currentWeekData?.tasks?.filter((task: any) => task.isMidWeekTask).length || 0;

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
    // TODO: Apply filters to the task list
  };

  // Handle mock data operations
  const handleDeleteTask = (taskId: string) => {
    if (useMockData) {
      setMockTasks((prev) => prev.filter((task) => task.id !== taskId));
      return true;
    }
    return false;
  };

  const handleEditTask = (task: any) => {
    if (useMockData) {
      setEditingTask(task);
      setIsAddTaskOpen(true);
      return true;
    }
    return false;
  };

  const handleUpdateTask = (updatedTask: any) => {
    if (useMockData) {
      setMockTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
      setEditingTask(null);
      return true;
    }
    return false;
  };

  const handleAddTask = (newTask: any) => {
    if (useMockData) {
      const task = {
        ...newTask,
        id: `mock-task-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setMockTasks((prev) => [...prev, task]);
      return true;
    }
    return false;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Check In/Out - Current Week(Active)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentWeekData && (
              <>
                Week: {new Date(currentWeekData.createdAt).toLocaleDateString()} - {new Date(currentWeekData.endDate).toLocaleDateString()}
              </>
            )}
          </p>
        </div>
        
        {/* Mock Data Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseMockData(!useMockData)}
          className={`gap-2 ${useMockData ? 'bg-[#3838EC] text-white hover:bg-[#2d2dbd]' : ''}`}
        >
          <EyeIcon className="w-4 h-4" />
          {useMockData ? "Viewing Mock Data" : "Preview Design"}
        </Button>
      </div>

      {loading ? (
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
            tasks={currentWeekData.tasks || []}
            createdDate={new Date(currentWeekData.createdAt)}
            searchQuery={searchQuery}
            onRefetch={refetch}
            useMockData={useMockData}
            onDeleteTask={handleDeleteTask}
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
          setIsAddTaskOpen(false);
          setEditingTask(null);
        }}
        useMockData={useMockData}
        onMockAdd={handleAddTask}
        onMockUpdate={handleUpdateTask}
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
