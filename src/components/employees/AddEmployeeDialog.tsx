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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";

interface AddEmployeeDialogProps {
  children: React.ReactNode;
}

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[320px] sm:max-w-[650px] max-h-[90vh] overflow-y-auto m-4 mx-auto sm:my-8">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-3xl font-semibold text-center text-[#0F1327]">
            Add Employee
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
          {/* Row 1: Full Name and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Enter full name" />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Row 2: Phone Number and Employment Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-sm text-gray-600">
                  +251
                </div>
                <Input
                  id="phoneNumber"
                  placeholder="Phone number"
                  className="rounded-l-none"
                />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="employmentStartDate">Employment Start Date</Label>
              <Input id="employmentStartDate" type="date" />
            </div>
          </div>

          {/* Row 3: Profile Picture and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <Label>Profile Picture</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-600">
                  Click or drag here to upload picture
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deactivated">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="px-6 w-full sm:w-auto order-2 sm:order-1 border border-primary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 w-full sm:w-auto bg-[#3838EC] hover:bg-[#3838EC]/90 order-1 sm:order-2"
            >
              Add Employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
