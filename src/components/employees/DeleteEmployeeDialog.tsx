"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteEmployeeDialogProps {
  children: React.ReactNode;
  employeeName?: string;
}

const DeleteEmployeeDialog: React.FC<DeleteEmployeeDialogProps> = ({
  children,
  employeeName = "this employee",
}) => {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    // Handle delete logic here
    console.log("Deleting employee:", employeeName);
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[320px] sm:max-w-[480px] mx-auto p-6 sm:p-8">
        <DialogHeader className="text-center space-y-8">
          {/* Trash Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>

          {/* Title and Message */}
          <div className="space-y-4">
            <DialogTitle className="text-lg font-semibold text-center text-[#0F1327]">
              Are you sure you want to delete {employeeName}?
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className=" order-2 sm:order-1"
          >
            No, Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className=" bg-red-600 hover:bg-red-700 text-white order-1 sm:order-2"
          >
            Yes, Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEmployeeDialog;
