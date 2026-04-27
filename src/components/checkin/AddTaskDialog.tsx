"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CREATE_CHECKIN } from "@/lib/graphql/mutations/checkins";
import { GET_MY_OBJECTIVES } from "@/lib/graphql/queries/objectives";
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
  useMockData?: boolean;
  onMockAdd?: (task: any) => boolean;
  onMockUpdate?: (task: any) => boolean;
  editingTask?: any;
}

type TaskType = "KPI_LINKED" | "INITIATIVE_LINKED" | "UNLINKED";

const TASK_TYPES = [
  { value: "KPI_LINKED", label: "KPI Linked" },
  { value: "INITIATIVE_LINKED", label: "Initiative Linked" },
  { value: "UNLINKED", label: "Unlinked" },
];

const CHECKOUT_STATUS = [
  { value: "NOT_DONE", label: "Not Done" },
  { value: "POSTPONED", label: "Postponed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PREDEFINED_TASKS = [
  {
    value: "task_1",
    label: "Review a Gafat RFP ON Stress Management Training",
  },
  {
    value: "task_2",
    label: "Preparing Technical Proposal FOR Gafat ON Stress Management Training",
  },
  {
    value: "task_3",
    label: "Preparing financial Proposal FOR BGI RFP ON Stress Management Training",
  },
  { value: "task_4", label: "Refine LEAD Proposal LEAD (COORPORATE)" },
  { value: "task_5", label: "Finalize performance report logbook" },
];

type TimeValue = { hour: string; minute: string; period: "AM" | "PM" };

export function AddTaskDialog({
  open,
  onOpenChange,
  onSuccess,
  useMockData = false,
  onMockAdd,
  onMockUpdate,
  editingTask,
}: AddTaskDialogProps) {
  const getNextSaturday = (fromDate: Date = new Date()) => {
    const date = new Date(fromDate);
    const day = date.getDay();
    const diff = day === 6 ? 7 : 6 - day;
    date.setDate(date.getDate() + diff);
    return date;
  };

  const today = new Date();

  const [taskType, setTaskType] = useState<TaskType>("KPI_LINKED");
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
  const [isKpiMet, setIsKpiMet] = useState(true);
  const [isInitiativeMet, setIsInitiativeMet] = useState(true);
  const [isSelfDevComplete, setIsSelfDevComplete] = useState(true);

  // ✅ Track popover open states separately so they don't conflict
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  const { data: objectivesData } = useQuery(GET_MY_OBJECTIVES);
  const [createCheckin, { loading }] = useMutation(CREATE_CHECKIN);

  // Populate form when editing
  useEffect(() => {
    if (editingTask && open) {
      setTaskType(editingTask.taskType);
      setTask(editingTask.task);
      setDescription(editingTask.description || "");
      setRelatedTo(editingTask.relatedTo || "");
      setLinkedKpi(editingTask.linkedKpi || "");
      setLinkedInitiative(editingTask.linkedInitiative || "");
      
      const startDateTime = new Date(editingTask.startTime);
      setStartDate(startDateTime);
      setStartTime({
        hour: startDateTime.getHours() > 12 ? String(startDateTime.getHours() - 12).padStart(2, '0') : String(startDateTime.getHours() || 12).padStart(2, '0'),
        minute: String(startDateTime.getMinutes()).padStart(2, '0'),
        period: startDateTime.getHours() >= 12 ? "PM" : "AM",
      });
      
      const endDateTime = new Date(editingTask.endTime);
      setEndDate(endDateTime);
      setEndTime({
        hour: endDateTime.getHours() > 12 ? String(endDateTime.getHours() - 12).padStart(2, '0') : String(endDateTime.getHours() || 12).padStart(2, '0'),
        minute: String(endDateTime.getMinutes()).padStart(2, '0'),
        period: endDateTime.getHours() >= 12 ? "PM" : "AM",
      });
      
      setCheckoutStatus(editingTask.checkoutStatus || "");
      setRemark(editingTask.remark || "");
      setIsKpiMet(editingTask.isKpiMet);
      setIsInitiativeMet(editingTask.isInitiativeMet);
      setIsSelfDevComplete(editingTask.isSelfDevComplete);
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
    if (!task || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const taskData = {
      taskType,
      task,
      description,
      relatedTo,
      linkedKpi: taskType === "KPI_LINKED" ? linkedKpi : undefined,
      linkedInitiative: taskType === "INITIATIVE_LINKED" ? linkedInitiative : undefined,
      startTime: buildDateTime(startDate, startTime).toISOString(),
      endTime: buildDateTime(endDate, endTime).toISOString(),
      checkoutStatus: checkoutStatus || "NOT_DONE",
      attachment: attachment?.name,
      remark,
      isKpiMet,
      isInitiativeMet,
      isSelfDevComplete,
      isMidWeekTask: false,
    };

    // Handle mock data
    if (useMockData) {
      if (editingTask && onMockUpdate) {
        const success = onMockUpdate({ ...taskData, id: editingTask.id, createdAt: editingTask.createdAt });
        if (success) {
          toast.success("Task updated successfully");
          onSuccess();
          resetForm();
          return;
        }
      } else if (onMockAdd) {
        const success = onMockAdd(taskData);
        if (success) {
          toast.success("Task added successfully");
          onSuccess();
          resetForm();
          return;
        }
      }
    }

    // Handle real data
    try {
      await createCheckin({
        variables: {
          input: taskData,
        },
      });

      toast.success(editingTask ? "Task updated successfully" : "Task added successfully");
      onSuccess();
      resetForm();
    } catch (error) {
      toast.error(editingTask ? "Failed to update task" : "Failed to add task");
      console.error(error);
    }
  };

  const resetForm = () => {
    const newToday = new Date();
    setTaskType("KPI_LINKED");
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
    setIsKpiMet(true);
    setIsInitiativeMet(true);
    setIsSelfDevComplete(true);
  };

  const RadioGroup = ({
    name,
    options,
    value,
    onChange,
  }: {
    name: string;
    options: { label: string; value: boolean }[];
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex gap-4 sm:flex-col sm:gap-2">
      {options.map((opt) => (
        <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="w-4 h-4 text-[#3838EC] border-gray-300 focus:ring-[#3838EC]"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );

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
              {taskType === "KPI_LINKED" && (
                <div className="pt-2">
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Linked KPI
                  </Label>
                  <CheckboxSelect
                    options={
                      objectivesData?.myObjectives?.map((obj: any) => ({
                        value: obj.objectiveId,
                        label: obj.name,
                      })) || []
                    }
                    value={linkedKpi ? [linkedKpi] : []}
                    onChange={(vals) => setLinkedKpi(vals[0] || "")}
                    placeholder="Select Linked KPI"
                    searchable
                    searchPlaceholder="Search KPI..."
                    predefinedTasks={PREDEFINED_TASKS}
                  />
                </div>
              )}

              {taskType === "INITIATIVE_LINKED" && (
                <div className="pt-2">
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Linked Initiative
                  </Label>
                  <CheckboxSelect
                    options={
                      objectivesData?.myObjectives?.map((obj: any) => ({
                        value: obj.objectiveId,
                        label: obj.name,
                      })) || []
                    }
                    value={linkedInitiative ? [linkedInitiative] : []}
                    onChange={(vals) => setLinkedInitiative(vals[0] || "")}
                    placeholder="Select Linked Initiative"
                    searchable
                    searchPlaceholder="Search Initiative..."
                    predefinedTasks={PREDEFINED_TASKS}
                  />
                </div>
              )}
            </div>

            {/* Task */}
            <div className="space-y-2">
              <Label htmlFor="task" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task"
                placeholder="Write major task..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="h-10 text-sm"
              />
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
                Related To
              </Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search a person..."
                  value={relatedTo}
                  onChange={(e) => setRelatedTo(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </div>

            {/* Start Date & Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date & Time
              </Label>
              <div className="flex gap-2">
                {/* ✅ Calendar Popover */}
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
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
                  {/* ✅ modal=false prevents Radix Dialog from blocking popover */}
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    // ✅ Render inside dialog but with high z-index
                    style={{ zIndex: 99999 }}
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
                <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen}>
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
                    className="w-auto p-0"
                    align="start"
                    style={{ zIndex: 99999 }}
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
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
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
                    className="w-auto p-0"
                    align="start"
                    style={{ zIndex: 99999 }}
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

                <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
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
                    className="w-auto p-0"
                    align="start"
                    style={{ zIndex: 99999 }}
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
                  "hover:border-[#3838EC] hover:bg-blue-50/30 dark:hover:bg-blue-950/10"
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

            {/* Checkout */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Checkout
              </Label>
              <CheckboxSelect
                options={CHECKOUT_STATUS}
                value={checkoutStatus ? [checkoutStatus] : []}
                onChange={(vals) => setCheckoutStatus(vals[vals.length - 1] || "")}
                placeholder="Select checkout status"
              />
            </div>

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

            {/* Status Questions */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Is KPI met or unmet?
                  </Label>
                  <RadioGroup
                    name="kpiStatus"
                    value={isKpiMet}
                    onChange={setIsKpiMet}
                    options={[
                      { label: "Met", value: true },
                      { label: "Unmet", value: false },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Is initiative met or unmet?
                  </Label>
                  <RadioGroup
                    name="initiativeStatus"
                    value={isInitiativeMet}
                    onChange={setIsInitiativeMet}
                    options={[
                      { label: "Met", value: true },
                      { label: "Unmet", value: false },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Self development complete?
                  </Label>
                  <RadioGroup
                    name="selfDevStatus"
                    value={isSelfDevComplete}
                    onChange={setIsSelfDevComplete}
                    options={[
                      { label: "Complete", value: true },
                      { label: "Incomplete", value: false },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="sm:w-auto bg-[#3838EC] hover:bg-[#2d2dbd] text-white"
          >
            {loading ? (editingTask ? "Updating..." : "Adding...") : (editingTask ? "Update Task" : "Add Task")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}