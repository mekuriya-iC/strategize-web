"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_CHECKINOUT_TASK,
  UPDATE_CHECKINOUT_TASK,
} from "@/lib/graphql/mutations/checkins";

import { GET_MY_KPIS } from "@/lib/graphql/queries/kpis";
import { GET_INITIATIVES } from "@/lib/graphql/queries/initiatives";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { useAuthStore } from "@/stores";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  CalendarIcon,
  UploadIcon,
  XIcon,
  SearchIcon,
  ClockIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { CheckboxSelect } from "@/components/ui/checkbox-select";
import { cn } from "@/lib/utils";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  sessionId?: string;
  editingTask?: any;
  session?: any; // Add session prop to check lock status
}

type TaskType =
  | "KPI_FULFILLED"
  | "KPI_UNMET"
  | "INITIATIVE_FULFILLED"
  | "INITIATIVE_UNMET"
  | "SELF_DEVELOPMENT"
  | "UNLINKED";

const TASK_TYPES = [
  { value: "KPI_UNMET", label: "KPI Unmet" },
  { value: "KPI_FULFILLED", label: "KPI Fulfilled" },
  { value: "INITIATIVE_FULFILLED", label: "Initiative Fulfilled" },
  { value: "INITIATIVE_UNMET", label: "Initiative Unmet" },
  { value: "SELF_DEVELOPMENT", label: "Self Development" },
  { value: "UNLINKED", label: "Unlinked" },
];

const CHECKOUT_STATUS = [
  { value: "NOT_DONE", label: "Not Done" },
  { value: "DONE", label: "Done" },
  { value: "POSTPONED", label: "Postponed" },
  { value: "CANCELLED", label: "Cancelled" },
];

type TimeValue = { hour: string; minute: string; period: "AM" | "PM" };

export function AddTaskDialog({
  open,
  onOpenChange,
  onSuccess,
  sessionId,
  editingTask,
  session,
}: AddTaskDialogProps) {
  const user = useAuthStore((state) => state.user);

  // Check if session is locked
  useEffect(() => {
    if (open && session?.isLocked && !editingTask) {
      toast.error("This session is locked. No tasks can be added or edited.");
      onOpenChange(false);
    }
  }, [open, session, editingTask, onOpenChange]);

  // Mutations
  const [createTaskMutation, { loading: creating }] = useMutation(
    CREATE_CHECKINOUT_TASK,
    {
      refetchQueries: ["GetCheckinoutSessions", "GetCheckinoutTasks"],
      awaitRefetchQueries: true,
    },
  );

  const [updateTaskMutation, { loading: updating }] = useMutation(
    UPDATE_CHECKINOUT_TASK,
    {
      refetchQueries: ["GetCheckinoutSessions", "GetCheckinoutTasks"],
      awaitRefetchQueries: true,
    },
  );

  const mutationLoading = creating || updating;

  // Queries
  const { data: kpisData } = useQuery(GET_MY_KPIS, {
    variables: { page: 1, limit: 100 },
    skip: !open,
  });

  const { data: initiativesData } = useQuery(GET_INITIATIVES, {
    variables: { page: 1, limit: 100 },
    skip: !open,
  });

  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 500 },
    skip: !open,
  });

  const getNextSaturday = (fromDate: Date = new Date()) => {
    const date = new Date(fromDate);
    const day = date.getDay();
    const diff = day === 6 ? 7 : 6 - day;
    date.setDate(date.getDate() + diff);
    return date;
  };

  const today = new Date();

  const [taskType, setTaskType] = useState<TaskType>("KPI_UNMET");
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [relatedTo, setRelatedTo] = useState("");
  const [linkedKpi, setLinkedKpi] = useState("");
  const [linkedInitiative, setLinkedInitiative] = useState("");
  const [startDate, setStartDate] = useState<Date>(today);
  const [startTime, setStartTime] = useState<TimeValue>({
    hour: "07",
    minute: "00",
    period: "AM",
  });
  const [endDate, setEndDate] = useState<Date>(getNextSaturday(today));
  const [endTime, setEndTime] = useState<TimeValue>({
    hour: "07",
    minute: "00",
    period: "AM",
  });
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [remark, setRemark] = useState("");
  const [isMidWeekTask, setIsMidWeekTask] = useState(false);
  const [midWeekTaskCount, setMidWeekTaskCount] = useState(0);

  // ✅ Track popover open states separately so they don't conflict
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingTask && open) {
      setTaskType(editingTask.taskType);
      setTask(editingTask.task);
      setDescription(editingTask.description || "");
      setRelatedTo(editingTask.relatedToEmployeeId || "");
      setLinkedKpi(editingTask.linkedKpiId || "");
      setLinkedInitiative(editingTask.linkedInitiativeId || "");

      const startDateTime = new Date(editingTask.startTime);
      setStartDate(startDateTime);
      setStartTime({
        hour:
          startDateTime.getHours() > 12
            ? String(startDateTime.getHours() - 12).padStart(2, "0")
            : String(startDateTime.getHours() || 12).padStart(2, "0"),
        minute: String(startDateTime.getMinutes()).padStart(2, "0"),
        period: startDateTime.getHours() >= 12 ? "PM" : "AM",
      });

      const endDateTime = new Date(editingTask.endTime);
      setEndDate(endDateTime);
      setEndTime({
        hour:
          endDateTime.getHours() > 12
            ? String(endDateTime.getHours() - 12).padStart(2, "0")
            : String(endDateTime.getHours() || 12).padStart(2, "0"),
        minute: String(endDateTime.getMinutes()).padStart(2, "0"),
        period: endDateTime.getHours() >= 12 ? "PM" : "AM",
      });

      setCheckoutStatus(editingTask.checkoutStatus || "NOT_DONE");
      setRemark(editingTask.remark || "");
    } else if (!open) {
      // Reset form when dialog closes
      resetForm();
    }
  }, [editingTask, open]);

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      setEndDate(getNextSaturday(date));
      setStartDateOpen(false);
    }
  };

  const buildDateTime = (date: Date, time: TimeValue): Date => {
    const dt = new Date(date);
    let hour = parseInt(time.hour);
    if (time.period === "PM" && hour !== 12) hour += 12;
    if (time.period === "AM" && hour === 12) hour = 0;
    dt.setHours(hour, parseInt(time.minute), 0, 0);
    return dt;
  };

  const handleSubmit = async () => {
    console.log("🚀 [TASK CREATION] Starting task submission...");
    console.log("📋 [TASK CREATION] Session ID:", sessionId);
    console.log("📋 [TASK CREATION] Editing Task:", editingTask);
    
    if (!task || !startDate || !endDate) {
      console.error("❌ [TASK CREATION] Validation failed: Missing required fields");
      toast.error("Please fill in all required fields");
      return;
    }

    if (!sessionId && !editingTask) {
      console.error("❌ [TASK CREATION] Validation failed: No active session");
      toast.error("No active session found");
      return;
    }

    // Validate end date is within session range
    if (session) {
      const sessionEndDate = new Date(session.endDate);
      const taskEndDateTime = buildDateTime(endDate, endTime);

      if (taskEndDateTime > sessionEndDate) {
        console.error("❌ [TASK CREATION] Validation failed: Task end date exceeds session end date");
        toast.error(
          `Task end date cannot be after session end date (${format(sessionEndDate, "MMM d, yyyy")})`,
        );
        return;
      }
    }

    // Validation for unmet tasks being marked as done
    const isUnmetTask = [
      "KPI_UNMET",
      "INITIATIVE_UNMET",
      "SELF_DEVELOPMENT_UNMET",
    ].includes(taskType);
    if (checkoutStatus === "DONE" && isUnmetTask) {
      if (!attachment || !remark.trim()) {
        console.error("❌ [TASK CREATION] Validation failed: Unmet task marked as done without attachment/remark");
        toast.error(
          "Attachment and remark are required when marking unmet tasks as done",
        );
        return;
      }
    }

    try {
      const taskData = {
        taskTitle: task.trim(),
        taskLinkType: taskType,
        linkedKpiId:
          (taskType === "KPI_FULFILLED" || taskType === "KPI_UNMET") &&
          linkedKpi
            ? linkedKpi
            : null,
        linkedInitiativeId:
          (taskType === "INITIATIVE_FULFILLED" ||
            taskType === "INITIATIVE_UNMET") &&
          linkedInitiative
            ? linkedInitiative
            : null,
        relatedToEmployeeId: relatedTo || null,
        plannedDescription: description.trim() || null,
        taskStartDate: buildDateTime(startDate, startTime).toISOString(),
        taskEndDate: buildDateTime(endDate, endTime).toISOString(),
        taskStatus: checkoutStatus || "NOT_DONE",
        evidenceUrl: attachment?.name || null,
        challenges: remark.trim() || null,
        isMidWeekTask: isMidWeekTask,
      };

      console.log("📤 [TASK CREATION] Prepared task data:", taskData);

      if (editingTask) {
        console.log("✏️ [TASK CREATION] Updating existing task:", editingTask.id);
        const result = await updateTaskMutation({
          variables: {
            input: {
              checkinoutTaskId: editingTask.id,
              ...taskData,
              achievedDescription: description.trim() || null,
            },
          },
        });
        console.log("✅ [TASK CREATION] Update mutation result:", result);
        console.log("✅ [TASK CREATION] Updated task data:", result.data?.updateCheckinoutTask);
        toast.success("Task updated successfully");
      } else {
        console.log("➕ [TASK CREATION] Creating new task for session:", sessionId);
        const result = await createTaskMutation({
          variables: {
            input: {
              sessionId: sessionId!,
              ...taskData,
            },
          },
        });
        console.log("✅ [TASK CREATION] Create mutation result:", result);
        console.log("✅ [TASK CREATION] Created task data:", result.data?.createCheckinoutTask);
        console.log("🆔 [TASK CREATION] New task ID:", result.data?.createCheckinoutTask?.checkinoutTaskId);
        toast.success("Task created successfully");
      }

      console.log("🔄 [TASK CREATION] Calling onSuccess callback to refetch...");

      // Show logbook message for fulfilled tasks
      const fulfilledTypes = [
        "KPI_FULFILLED",
        "INITIATIVE_FULFILLED",
        "SELF_DEVELOPMENT_FULFILLED",
      ];
      if (fulfilledTypes.includes(taskType)) {
        toast.success("Task added to logbook for approval");
      }

      onSuccess();
      console.log("✅ [TASK CREATION] onSuccess callback completed");
      resetForm();
      console.log("✅ [TASK CREATION] Form reset completed");
    } catch (error: any) {
      console.error("❌ [TASK CREATION] Error during task operation:", error);
      console.error("❌ [TASK CREATION] Error message:", error.message);
      console.error("❌ [TASK CREATION] Error stack:", error.stack);
      console.error("❌ [TASK CREATION] GraphQL errors:", error.graphQLErrors);
      console.error("❌ [TASK CREATION] Network error:", error.networkError);

      // Check if error is about date validation from backend
      if (
        error.message?.includes("end date") ||
        error.message?.includes("session")
      ) {
        toast.error(error.message);
      } else {
        toast.error(
          error.message ||
            `Failed to ${editingTask ? "update" : "create"} task`,
        );
      }
    }
  };

  const resetForm = () => {
    const newToday = new Date();
    setTaskType("KPI_UNMET");
    setTask("");
    setDescription("");
    setRelatedTo("");
    setLinkedKpi("");
    setLinkedInitiative("");
    setStartDate(newToday);
    setStartTime({ hour: "07", minute: "00", period: "AM" });
    setEndDate(getNextSaturday(newToday));
    setEndTime({ hour: "07", minute: "00", period: "AM" });
    setCheckoutStatus("");
    setAttachment(null);
    setRemark("");
    setIsMidWeekTask(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-xl font-semibold">
            {editingTask ? "Edit Task" : "Add a Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[80vh] px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            {/* Task Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Type
              </Label>
              <div className="space-y-2">
                {TASK_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="taskType"
                      value={type.value}
                      checked={taskType === type.value}
                      onChange={(e) => setTaskType(e.target.value as TaskType)}
                      className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Linked Dropdowns — react-select handles portal automatically */}
              {(taskType === "KPI_FULFILLED" || taskType === "KPI_UNMET") && (
                <div className="pt-2">
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Linked KPI
                  </Label>
                  <CheckboxSelect
                    options={
                      kpisData?.myKpis?.items?.map((kpi: any) => ({
                        value: kpi.kpiId,
                        label: kpi.name,
                      })) || []
                    }
                    value={linkedKpi ? [linkedKpi] : []}
                    onChange={(vals) => setLinkedKpi(vals[0] || "")}
                    placeholder="Select Linked KPI"
                    searchable
                    searchPlaceholder="Search KPI..."
                  />
                </div>
              )}

              {(taskType === "INITIATIVE_FULFILLED" ||
                taskType === "INITIATIVE_UNMET") && (
                <div className="pt-2">
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Linked Initiative
                  </Label>
                  <CheckboxSelect
                    options={
                      initiativesData?.initiatives?.items?.map((init: any) => ({
                        value: init.initiativeId,
                        label: init.title,
                      })) || []
                    }
                    value={linkedInitiative ? [linkedInitiative] : []}
                    onChange={(vals) => setLinkedInitiative(vals[0] || "")}
                    placeholder="Select Linked Initiative"
                    searchable
                    searchPlaceholder="Search Initiative..."
                  />
                </div>
              )}
            </div>

            {/* Task */}
            <div className="space-y-2">
              <Label
                htmlFor="task"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Task <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task"
                placeholder="Write major task..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="h-10 text-sm"
              />

              {/* Mid-Week Task Checkbox */}
              {!editingTask && (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="midWeekTask"
                    checked={isMidWeekTask}
                    onCheckedChange={(checked) =>
                      setIsMidWeekTask(checked as boolean)
                    }
                    disabled={!isMidWeekTask && midWeekTaskCount >= 3}
                  />
                  <label
                    htmlFor="midWeekTask"
                    className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Mid-Week Task ({midWeekTaskCount}/3)
                  </label>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </Label>
              <Textarea
                placeholder="Write description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] text-sm resize-none"
              />
            </div>

            {/* Related To */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Related To (Optional)
              </Label>
              <CheckboxSelect
                options={
                  employeesData?.employees?.items?.map((emp: any) => ({
                    value: emp.employeeId,
                    label: emp.fullName,
                  })) || []
                }
                value={relatedTo ? [relatedTo] : []}
                onChange={(vals) => setRelatedTo(vals[0] || "")}
                placeholder="Search a person..."
                searchable
                searchPlaceholder="Search employees..."
              />
            </div>

            {/* Start Date & Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date & Time
              </Label>
              <div className="flex gap-2">
                {/* ✅ Calendar Popover */}
                <Popover
                  open={startDateOpen}
                  onOpenChange={setStartDateOpen}
                  modal={true}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 justify-start text-sm font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                      <span className="truncate">
                        {format(startDate, "MMM d, yyyy")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-[9999]"
                    align="start"
                    sideOffset={5}
                  >
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateChange}
                      disabled={(d) =>
                        d < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* ✅ Time Popover */}
                <Popover
                  open={startTimeOpen}
                  onOpenChange={setStartTimeOpen}
                  modal={true}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-28 h-10 justify-start text-sm font-normal shrink-0"
                    >
                      <ClockIcon className="mr-1.5 h-4 w-4 text-gray-500 shrink-0" />
                      <span className="tabular-nums text-xs">
                        {startTime.hour}:{startTime.minute} {startTime.period}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-[9999]"
                    align="start"
                    sideOffset={5}
                  >
                    <TimePicker
                      value={startTime}
                      onChange={setStartTime}
                      onClose={() => setStartTimeOpen(false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date & Time
              </Label>
              <div className="flex gap-2">
                <Popover
                  open={endDateOpen}
                  onOpenChange={setEndDateOpen}
                  modal={true}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 justify-start text-sm font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                      <span className="truncate">
                        {format(endDate, "MMM d, yyyy")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-[9999]"
                    align="start"
                    sideOffset={5}
                  >
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => {
                        if (d) {
                          setEndDate(d);
                          setEndDateOpen(false);
                        }
                      }}
                      disabled={(d) => d < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover
                  open={endTimeOpen}
                  onOpenChange={setEndTimeOpen}
                  modal={true}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-28 h-10 justify-start text-sm font-normal shrink-0"
                    >
                      <ClockIcon className="mr-1.5 h-4 w-4 text-gray-500 shrink-0" />
                      <span className="tabular-nums text-xs">
                        {endTime.hour}:{endTime.minute} {endTime.period}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-[9999]"
                    align="start"
                    sideOffset={5}
                  >
                    <TimePicker
                      value={endTime}
                      onChange={setEndTime}
                      onClose={() => setEndTimeOpen(false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Attachment (Optional)
              </Label>
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition-colors",
                  "border-2 border-dashed border-gray-300 dark:border-gray-600",
                  "hover:border-[#3838EC] hover:bg-blue-50/30 dark:hover:bg-blue-950/10",
                )}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setAttachment(e.target.files[0]);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <UploadIcon className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Click or drag here to upload
                </span>
              </label>
              {attachment && (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                    {attachment.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-red-400 hover:text-red-600 shrink-0"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Checkout Status - only shown while editing an existing task */}
            {editingTask && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Checkout Status
                </Label>
                <CheckboxSelect
                  options={CHECKOUT_STATUS}
                  value={checkoutStatus ? [checkoutStatus] : ["NOT_DONE"]}
                  onChange={(vals) =>
                    setCheckoutStatus(vals[vals.length - 1] || "NOT_DONE")
                  }
                  placeholder="Select checkout status"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  When editing your task, you can change its status to Not Done,
                  Done, Postponed, or Cancelled.
                </p>
              </div>
            )}

            {/* Remark */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Remark (Optional)
              </Label>
              <Textarea
                placeholder="Write remark..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="min-h-[100px] text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutationLoading}
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutationLoading}
            className="sm:w-auto bg-[#3838EC] hover:bg-[#2d2dbd] text-white"
          >
            {mutationLoading
              ? editingTask
                ? "Updating..."
                : "Adding..."
              : editingTask
                ? "Save Changes"
                : "Add Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
