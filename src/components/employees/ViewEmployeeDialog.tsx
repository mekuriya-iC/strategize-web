"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Employee } from "@/types/graphql";
import EmployeeAvatar from "./EmployeeAvatar";
import EmployeeRoleBadge from "./EmployeeRoleBadge";
import EmployeeStatusBadge from "./EmployeeStatusBadge";

interface ViewEmployeeDialogProps {
  children: React.ReactNode;
  employee: Employee;
}

function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber === "N/A") return "N/A";
  if (phoneNumber.startsWith("+251")) return phoneNumber;
  if (phoneNumber.startsWith("251")) return `+${phoneNumber}`;
  return `+251${phoneNumber}`;
}

function getProfileImageUrl(picture?: string): string {
  if (!picture) return "/avatars/default.png";
  if (
    picture.includes("storage.googleapis.com") ||
    picture.includes("storage.cloud.google.com")
  ) {
    return `/api/storage/${picture.split("/").pop()}`;
  }
  return picture;
}

const ViewEmployeeDialog: React.FC<ViewEmployeeDialogProps> = ({
  children,
  employee,
}) => {
  const [open, setOpen] = useState(false);

  const profileUrl = getProfileImageUrl(employee.picture);
  const employedOn = employee.startDate
    ? new Date(employee.startDate).toLocaleDateString()
    : "N/A";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <EmployeeAvatar
              src={profileUrl}
              alt={employee.fullName}
              downloadUrl={profileUrl}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {employee.fullName}
              </h3>
              <p className="text-sm text-gray-500">{employee.title || "—"}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">Email</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100 break-all">
                {employee.email}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Phone</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {formatPhoneNumber(employee.phoneNumber)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Access role</dt>
              <dd>
                <EmployeeRoleBadge role={employee.role} />
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Status</dt>
              <dd>
                <EmployeeStatusBadge
                  status={employee.status === "ACTIVE" ? "Active" : "Deactivated"}
                />
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Employed on</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {employedOn}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Employee ID</dt>
              <dd className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                {employee.employeeId}
              </dd>
            </div>
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEmployeeDialog;
