"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Users } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";
import { GET_CHECKINOUT_SESSIONS } from "@/lib/graphql/queries/checkins";
import { CREATE_CHECKINOUT_SESSION } from "@/lib/graphql/mutations/checkins";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import { toast } from "sonner";

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onSuccess?: () => void;
}

export default function CreateSessionDialog({
  open,
  onOpenChange,
  currentUserId,
  onSuccess,
}: CreateSessionDialogProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [strategicPeriodId, setStrategicPeriodId] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");
  const [weekEndDate, setWeekEndDate] = useState("");
  const [sprintTitle, setSprintTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const organizationId = useOrganizationId();

  // Get current user to check role
  const { data: userData, loading: userLoading } = useQuery(GET_ME);
  const currentUser = userData?.me;
  const safeCurrentUserId = currentUserId || currentUser?.employeeId || "";
  const isAdmin =
    currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  // Debug logging
  console.log("👤 Current User:", currentUser);
  console.log("🔑 Current User ID (employeeId):", safeCurrentUserId);
  console.log("👔 Is Admin:", isAdmin);
  console.log("⏳ User Loading:", userLoading);

  // Get all employees (only for admins)
  const { data: employeesData, loading: employeesLoading } = useQuery(
    GET_EMPLOYEES,
    {
      variables: {
        page: 1,
        limit: 1000,
      },
      skip: !isAdmin || userLoading, // Skip if not admin or still loading user data
      fetchPolicy: "cache-and-network",
    },
  );

  // Get departments where current user is head (for managers)
  const { data: departmentsData, loading: departmentsLoading } = useQuery(
    GET_DEPARTMENTS,
    {
      variables: { page: 1, limit: 1000 },
      skip: isAdmin || userLoading, // Skip if admin (they use employees query) or still loading user
      fetchPolicy: "cache-and-network",
    },
  );

  // Get divisions where current user is head (for division managers)
  const { data: divisionsData, loading: divisionsLoading } = useQuery(
    GET_DIVISIONS,
    {
      variables: { page: 1, limit: 1000 },
      skip: isAdmin || userLoading, // Skip if admin (they use employees query) or still loading user
      fetchPolicy: "cache-and-network",
    },
  );

  // Get existing sessions for this supervisor to find their direct reports
  const { data: existingSessionsData, loading: sessionsLoading } = useQuery(
    GET_CHECKINOUT_SESSIONS,
    {
      variables: {
        supervisorUserId: safeCurrentUserId,
        page: 1,
        limit: 1000,
      },
      skip: !open || !safeCurrentUserId || userLoading, // Skip if dialog closed, no user ID, or still loading user
      fetchPolicy: "cache-and-network",
    },
  );

  // Get strategic periods
  const { data: periodsData, loading: periodsLoading } = useQuery(
    GET_STRATEGIC_PERIODS,
    {
      variables: { page: 1, limit: 100 },
      fetchPolicy: "cache-and-network",
    },
  );

  const [createSession] = useMutation(CREATE_CHECKINOUT_SESSION);

  const allEmployees = employeesData?.employees?.items || [];
  const departments = departmentsData?.departments?.items || [];
  const divisions = divisionsData?.divisions?.items || [];
  const periods = periodsData?.strategicPeriods?.items || [];
  const existingSessions =
    existingSessionsData?.checkinoutSessions?.items || [];

  // Debug logging for data
  console.log("📊 Data loaded:", {
    allEmployees: allEmployees.length,
    departments: departments.length,
    divisions: divisions.length,
    existingSessions: existingSessions.length,
    employeesLoading,
    departmentsLoading,
    divisionsLoading,
    sessionsLoading,
  });

  // Get employees from departments where current user is head (for department managers)
  // OR get department managers from divisions where current user is head (for division managers)
  const employeesFromDepartments = useMemo(() => {
    console.log("🔍 Checking departments for manager:", safeCurrentUserId);
    console.log("📋 Total departments:", departments.length);
    console.log("🏢 Total divisions:", divisions.length);

    const employeeMap = new Map();

    // Check if user is a department manager (head of departments)
    departments.forEach((dept: any) => {
      console.log(
        `  Department: ${dept.name}, Head: ${dept.head?.employeeId} (${dept.head?.fullName})`,
      );

      // Check if current user is the head of this department
      if (dept.head?.employeeId === safeCurrentUserId) {
        console.log(`  ✅ Current user IS head of ${dept.name}`);
        console.log(
          `  👥 Employees in department:`,
          dept.employees?.length || 0,
        );

        // Add all employees from this department
        dept.employees?.forEach((emp: any) => {
          if (emp.employeeId && emp.employeeId !== safeCurrentUserId) {
            // Don't include the manager themselves
            console.log(
              `    Adding employee: ${emp.fullName} (${emp.employeeId})`,
            );
            employeeMap.set(emp.employeeId, emp);
          }
        });
      } else {
        console.log(`  ❌ Current user is NOT head of ${dept.name}`);
      }
    });

    // Check if user is a division manager (head of divisions)
    divisions.forEach((division: any) => {
      console.log(
        `  Division: ${division.name}, Head: ${division.head?.employeeId} (${division.head?.fullName})`,
      );

      // Check if current user is the head of this division
      if (division.head?.employeeId === safeCurrentUserId) {
        console.log(`  ✅ Current user IS head of ${division.name}`);
        console.log(
          `  🏢 Departments in division:`,
          division.departments?.length || 0,
        );

        // Add all department managers (heads) from departments in this division
        division.departments?.forEach((dept: any) => {
          if (
            dept.head &&
            dept.head.employeeId &&
            dept.head.employeeId !== safeCurrentUserId
          ) {
            // Don't include the division manager themselves
            console.log(
              `    Adding department manager: ${dept.head.fullName} (${dept.head.employeeId}) from ${dept.name}`,
            );
            employeeMap.set(dept.head.employeeId, dept.head);
          }
        });
      } else {
        console.log(`  ❌ Current user is NOT head of ${division.name}`);
      }
    });

    console.log("✨ Total employees/managers found:", employeeMap.size);
    return Array.from(employeeMap.values());
  }, [departments, divisions, safeCurrentUserId]);

  // Direct reports: Admins see all employees, Managers see employees from their departments
  const directReports = useMemo(() => {
    console.log("🎯 Computing directReports:", {
      isAdmin,
      allEmployeesCount: allEmployees.length,
      employeesFromDepartmentsCount: employeesFromDepartments.length,
    });
    if (isAdmin) {
      console.log("  → Using allEmployees for admin");
      return allEmployees;
    }
    console.log("  → Using employeesFromDepartments for manager");
    return employeesFromDepartments;
  }, [isAdmin, allEmployees, employeesFromDepartments]);

  // Check for active sessions for each employee
  const employeesWithActiveSessions = useMemo(() => {
    const activeSessionEmployeeIds = new Set<string>();

    existingSessions.forEach((session: any) => {
      if (session.overallStatus === "OPEN") {
        activeSessionEmployeeIds.add(session.employee?.employeeId);
      }
    });

    return activeSessionEmployeeIds;
  }, [existingSessions]);

  // Filter out employees who already have active sessions
  const availableEmployees = useMemo(() => {
    const available = directReports.filter(
      (emp: any) => !employeesWithActiveSessions.has(emp.employeeId),
    );
    console.log(
      "✅ Available employees:",
      available.length,
      "out of",
      directReports.length,
    );
    return available;
  }, [directReports, employeesWithActiveSessions]);

  // Auto-calculate week end date (7 days after start) - REMOVED, now manual
  // useEffect(() => {
  //   if (weekStartDate) {
  //     const startDate = new Date(weekStartDate);
  //     const endDate = new Date(startDate);
  //     endDate.setDate(endDate.getDate() + 6); // 7 days total (start day + 6)
  //     setWeekEndDate(endDate.toISOString().split('T')[0]);
  //   }
  // }, [weekStartDate]);

  // Set default start date to today
  useEffect(() => {
    if (open && !weekStartDate) {
      const today = new Date();
      setWeekStartDate(today.toISOString().split("T")[0]);

      // Set default end date to 7 days from today
      const defaultEndDate = new Date(today);
      defaultEndDate.setDate(today.getDate() + 6);
      setWeekEndDate(defaultEndDate.toISOString().split("T")[0]);
    }
  }, [open, weekStartDate]);

  // Get today's date for min attribute
  const today = new Date().toISOString().split("T")[0];

  // Calculate session duration
  const sessionDuration = useMemo(() => {
    if (!weekStartDate || !weekEndDate) return null;

    const startDate = new Date(weekStartDate);
    const endDate = new Date(weekEndDate);
    const durationDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    if (durationDays <= 0) return null;

    if (durationDays === 7) return "1 week";
    if (durationDays === 14) return "2 weeks";
    if (durationDays === 21) return "3 weeks";
    if (durationDays === 28) return "4 weeks";

    return `${durationDays} days`;
  }, [weekStartDate, weekEndDate]);

  const handleToggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === availableEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(
        availableEmployees.map((emp: any) => emp.employeeId),
      );
    }
  };

  const handleCreate = async () => {
    console.log("🚀 handleCreate called");
    console.log("📊 Form state:", {
      selectedEmployees: selectedEmployees.length,
      strategicPeriodId,
      weekStartDate,
      weekEndDate,
      currentUserId: safeCurrentUserId,
    });

    if (!safeCurrentUserId) {
      toast.error("Current user is still loading. Please try again.");
      return;
    }

    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    if (!strategicPeriodId) {
      toast.error("Please select a strategic period");
      return;
    }

    if (!weekStartDate || !weekEndDate) {
      toast.error("Please select start and end dates");
      return;
    }

    // Validate end date is after start date
    const startDate = new Date(weekStartDate);
    const endDate = new Date(weekEndDate);

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    // Calculate duration in days
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (durationDays < 1) {
      toast.error("Session must be at least 1 day long");
      return;
    }

    setCreating(true);
    let successCount = 0;
    let errorCount = 0;
    const successfulEmployees: string[] = [];
    const failedEmployees: string[] = [];

    try {
      for (const employeeId of selectedEmployees) {
        try {
          console.log("🔄 Creating session for employee:", employeeId);
          console.log("📝 Input:", {
            employeeUserId: employeeId,
            supervisorUserId: safeCurrentUserId,
            strategicPeriodId,
            weekStartDate,
            weekEndDate,
            organizationId: "00000000-0000-0000-0000-000000000001",
          });

          const result = await createSession({
            variables: {
              input: {
                title: sprintTitle || undefined,
                employeeUserId: employeeId,
                supervisorUserId: safeCurrentUserId,
                strategicPeriodId,
                weekStartDate,
                weekEndDate,
                organizationId,
              },
            },
          });

          console.log("✅ Session created:", result.data);
          successCount++;

          // Get employee name for success message
          const employee = directReports.find(
            (emp: any) => emp.employeeId === employeeId,
          );
          if (employee) {
            successfulEmployees.push(employee.fullName);
          }
        } catch (error: any) {
          console.error(
            `Failed to create session for employee ${employeeId}:`,
            error,
          );
          errorCount++;

          // Get employee name for error message
          const employee = directReports.find(
            (emp: any) => emp.employeeId === employeeId,
          );
          if (employee) {
            failedEmployees.push(employee.fullName);
          }
        }
      }

      if (errorCount === 0) {
        const durationText =
          durationDays === 7
            ? "1 week"
            : durationDays === 14
              ? "2 weeks"
              : `${durationDays} days`;
        const dateRange = `${new Date(weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(weekEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

        if (successfulEmployees.length <= 3) {
          toast.success(
            `Check-in period created for ${successfulEmployees.join(", ")} (${dateRange})`,
          );
        } else {
          toast.success(
            `Check-in period created for ${successCount} employees (${dateRange}, ${durationText})`,
          );
        }

        onOpenChange(false);
        resetForm();
        onSuccess?.();
      } else {
        toast.warning(
          `Created sessions for ${successCount} employee${successCount !== 1 ? "s" : ""}, ${errorCount} failed${failedEmployees.length > 0 ? `: ${failedEmployees.join(", ")}` : ""}`,
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create check-in period");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployees([]);
    setStrategicPeriodId("");
    setWeekStartDate("");
    setWeekEndDate("");
    setSprintTitle("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Check-In Period</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Set up a check-in period for your team members. Each employee will
            get their own session to track their tasks.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sprint Title */}
          <div className="space-y-2">
            <Label htmlFor="sprintTitle">
              Sprint Title{" "}
              <span className="text-gray-500 text-xs">(Optional)</span>
            </Label>
            <Input
              id="sprintTitle"
              placeholder="e.g., Q2 Sprint 1, April Sprint, etc."
              value={sprintTitle}
              onChange={(e) => setSprintTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              Give this sprint a memorable name. If left empty, it will be
              auto-generated.
            </p>
          </div>

          {/* Strategic Period Selection */}
          <div className="space-y-2">
            <Label htmlFor="period">
              Strategic Period <span className="text-red-500">*</span>
            </Label>
            <Select
              value={strategicPeriodId}
              onValueChange={setStrategicPeriodId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period..." />
              </SelectTrigger>
              <SelectContent>
                {periodsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading periods...
                  </SelectItem>
                ) : periods.length > 0 ? (
                  periods.map((period: any) => (
                    <SelectItem
                      key={period.strategicPeriodId}
                      value={period.strategicPeriodId}
                    >
                      {period.name} ({new Date(period.startDate).getFullYear()})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No periods available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Week Date Range */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="startDate"
                    type="date"
                    value={weekStartDate}
                    onChange={(e) => setWeekStartDate(e.target.value)}
                    min={today}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Must be today or future date
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="endDate"
                    type="date"
                    value={weekEndDate}
                    onChange={(e) => setWeekEndDate(e.target.value)}
                    min={weekStartDate || today}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Flexible duration (1 week, 2 weeks, etc.)
                </p>
              </div>
            </div>

            {/* Duration Display */}
            {sessionDuration && (
              <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="text-gray-700">Session Duration:</span>
                  <span className="font-semibold text-indigo-600">
                    {sessionDuration}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Employee Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Select Employees <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleSelectAll}
                className="h-auto p-0 text-indigo-600"
                disabled={availableEmployees.length === 0}
              >
                {selectedEmployees.length === availableEmployees.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            {employeesLoading ||
            departmentsLoading ||
            divisionsLoading ||
            sessionsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">
                    Loading employees...
                  </p>
                </div>
              </div>
            ) : availableEmployees.length > 0 ? (
              <ScrollArea className="h-64 border rounded-lg">
                <div className="p-4 space-y-2">
                  {availableEmployees.map((employee: any) => (
                    <div
                      key={employee.employeeId}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Checkbox
                        id={`employee-${employee.employeeId}`}
                        checked={selectedEmployees.includes(
                          employee.employeeId,
                        )}
                        onCheckedChange={() =>
                          handleToggleEmployee(employee.employeeId)
                        }
                      />
                      <label
                        htmlFor={`employee-${employee.employeeId}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-indigo-600">
                              {employee.fullName?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {employee.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : directReports.length > 0 ? (
              <div className="flex flex-col items-center justify-center h-32 border rounded-lg bg-amber-50">
                <Users className="h-8 w-8 text-amber-500 mb-2" />
                <p className="text-sm text-amber-700 font-medium">
                  All team members have active sessions
                </p>
                <p className="text-xs text-amber-600 mt-2 text-center px-4 max-w-sm">
                  Close existing sessions before creating new ones. Only one
                  active session per employee is allowed.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 border rounded-lg bg-gray-50">
                <Users className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  No team members found
                </p>
                <p className="text-xs text-gray-500 mt-2 text-center px-4 max-w-sm">
                  {isAdmin
                    ? "No employees found in the system"
                    : "You need to be assigned as the head of a department (with employees) or division (with departments) to create check-in sessions."}
                </p>
              </div>
            )}

            {selectedEmployees.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold text-green-600">
                    {selectedEmployees.length}
                  </span>{" "}
                  employee{selectedEmployees.length !== 1 ? "s" : ""} selected
                  {sessionDuration && (
                    <span className="text-gray-500">
                      {" "}
                      • {sessionDuration} period
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              creating ||
              selectedEmployees.length === 0 ||
              !strategicPeriodId ||
              !weekStartDate ||
              !weekEndDate
            }
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                Create Period for {selectedEmployees.length} Employee
                {selectedEmployees.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
