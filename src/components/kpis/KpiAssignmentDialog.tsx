"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus, Building2, Users, User } from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_KPI_ASSIGNMENT_EMPLOYEE,
  CREATE_KPI_ASSIGNMENT_DEPARTMENT,
  CREATE_KPI_ASSIGNMENT_DIVISION,
} from "@/lib/graphql/mutations/kpis";
import { useAuthStore } from "@/stores";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { toast } from "sonner";

interface KpiAssignmentDialogProps {
  kpi: {
    kpiId: string;
    name: string;
    targetValue: number;
    measurementUnit: string;
  };
  strategicPeriodId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function KpiAssignmentDialog({
  kpi,
  strategicPeriodId,
  onSuccess,
  trigger,
}: KpiAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"EMPLOYEE" | "DEPARTMENT" | "DIVISION">("EMPLOYEE");
  const [selectedId, setSelectedId] = useState("");
  const [targetValue, setTargetValue] = useState(kpi.targetValue.toString());
  const [weight, setWeight] = useState("100");

  // Fetch employees - filter by department for non-admins
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { 
      page: 1, 
      limit: 1000,
      // Only admins can see all employees, others see department employees
      ...(isAdmin ? {} : { departmentId: user?.department?.departmentId })
    },
    skip: assignmentType !== "EMPLOYEE" || (!isAdmin && !user?.department?.departmentId),
  });

  // Fetch departments
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    skip: assignmentType !== "DEPARTMENT",
  });

  // Fetch divisions
  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 },
    skip: assignmentType !== "DIVISION",
  });

  const [createEmployeeAssignment, { loading: loadingEmployee }] = useMutation(
    CREATE_KPI_ASSIGNMENT_EMPLOYEE,
    {
      onCompleted: () => {
        toast.success(`✅ KPI assigned to employee successfully`);
        handleClose();
      },
      onError: (error) => {
        toast.error(`Failed to assign KPI: ${error.message}`);
      },
    }
  );

  const [createDepartmentAssignment, { loading: loadingDepartment }] = useMutation(
    CREATE_KPI_ASSIGNMENT_DEPARTMENT,
    {
      onCompleted: () => {
        toast.success(`✅ KPI assigned to department successfully`);
        handleClose();
      },
      onError: (error) => {
        toast.error(`Failed to assign KPI: ${error.message}`);
      },
    }
  );

  const [createDivisionAssignment, { loading: loadingDivision }] = useMutation(
    CREATE_KPI_ASSIGNMENT_DIVISION,
    {
      onCompleted: () => {
        toast.success(`✅ KPI assigned to division successfully`);
        handleClose();
      },
      onError: (error) => {
        toast.error(`Failed to assign KPI: ${error.message}`);
      },
    }
  );

  const loading = loadingEmployee || loadingDepartment || loadingDivision;

  const handleClose = () => {
    setOpen(false);
    setSelectedId("");
    setTargetValue(kpi.targetValue.toString());
    setWeight("100");
    onSuccess?.();
  };

  const handleSubmit = async () => {
    if (!selectedId) {
      toast.error("Please select an assignee");
      return;
    }

    const target = parseFloat(targetValue);
    const weightValue = parseFloat(weight);

    if (isNaN(target) || isNaN(weightValue)) {
      toast.error("Please enter valid numbers");
      return;
    }

    try {
      if (assignmentType === "EMPLOYEE") {
        await createEmployeeAssignment({
          variables: {
            input: {
              kpiId: kpi.kpiId,
              userId: selectedId, // Backend uses userId not employeeId
              strategicPeriodId,
              targetValue: target,
              weight: weightValue,
            },
          },
        });
      } else if (assignmentType === "DEPARTMENT") {
        await createDepartmentAssignment({
          variables: {
            input: {
              kpiId: kpi.kpiId,
              departmentId: selectedId,
              strategicPeriodId,
              targetValue: target,
              weight: weightValue,
            },
          },
        });
      } else if (assignmentType === "DIVISION") {
        await createDivisionAssignment({
          variables: {
            input: {
              kpiId: kpi.kpiId,
              divisionId: selectedId,
              strategicPeriodId,
              targetValue: target,
              weight: weightValue,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error assigning KPI:", error);
    }
  };

  const employees = employeesData?.employees?.items || [];
  const departments = departmentsData?.departments?.items || [];
  const divisions = divisionsData?.divisions?.items || [];

  const getAssignmentIcon = () => {
    switch (assignmentType) {
      case "EMPLOYEE":
        return <User className="w-5 h-5 text-blue-600" />;
      case "DEPARTMENT":
        return <Users className="w-5 h-5 text-green-600" />;
      case "DIVISION":
        return <Building2 className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Assign KPI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Assign KPI
          </DialogTitle>
          <DialogDescription>
            Assign <strong>{kpi.name}</strong> to an employee, department, or division
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Assignment Type */}
          <div className="space-y-2">
            <Label>Assignment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={assignmentType === "EMPLOYEE" ? "default" : "outline"}
                className="gap-2"
                onClick={() => {
                  setAssignmentType("EMPLOYEE");
                  setSelectedId("");
                }}
              >
                <User className="w-4 h-4" />
                Employee
              </Button>
              <Button
                type="button"
                variant={assignmentType === "DEPARTMENT" ? "default" : "outline"}
                className="gap-2"
                onClick={() => {
                  setAssignmentType("DEPARTMENT");
                  setSelectedId("");
                }}
              >
                <Users className="w-4 h-4" />
                Department
              </Button>
              <Button
                type="button"
                variant={assignmentType === "DIVISION" ? "default" : "outline"}
                className="gap-2"
                onClick={() => {
                  setAssignmentType("DIVISION");
                  setSelectedId("");
                }}
              >
                <Building2 className="w-4 h-4" />
                Division
              </Button>
            </div>
          </div>

          {/* Assignee Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {getAssignmentIcon()}
              Select {assignmentType.charAt(0) + assignmentType.slice(1).toLowerCase()}
            </Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${assignmentType.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {assignmentType === "EMPLOYEE" &&
                  employees.map((emp: any) => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} - {emp.email}
                    </SelectItem>
                  ))}
                {assignmentType === "DEPARTMENT" &&
                  departments.map((dept: any) => (
                    <SelectItem key={dept.departmentId} value={dept.departmentId}>
                      {dept.name}
                    </SelectItem>
                  ))}
                {assignmentType === "DIVISION" &&
                  divisions.map((div: any) => (
                    <SelectItem key={div.divisionId} value={div.divisionId}>
                      {div.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="targetValue">
              Target Value <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="targetValue"
                type="number"
                step="0.01"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-400">
                {kpi.measurementUnit}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Original target: {kpi.targetValue} {kpi.measurementUnit}
            </p>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight">
              Weight (%) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Contribution weight for this assignment
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Assigning..." : "Assign KPI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
