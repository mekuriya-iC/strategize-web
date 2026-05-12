"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores";
import { useEmployeeMutations } from "@/hooks/employees/useEmployeeMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS } from "@/types/graphql";
import { getInitials } from "@/lib/user-utils";
import { Camera, Save, User, X } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSettings() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { updateEmployee, updateLoading } = useEmployeeMutations();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    title: user?.title || "",
  });

  // Reset form when user changes or when canceling edit
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        title: user.title || "",
      });
    }
  }, [user]);

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phoneNumber || "",
      title: user?.title || "",
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user?.employeeId) {
      toast.error("Unable to update profile: User not found");
      return;
    }

    // Check if anything changed
    const hasChanges =
      formData.fullName !== user.fullName ||
      formData.email !== user.email ||
      formData.phone !== user.phoneNumber ||
      formData.title !== user.title;

    if (!hasChanges) {
      toast.info("No changes to save");
      setIsEditing(false);
      return;
    }

    try {
      const result = await updateEmployee({
        employeeId: user.employeeId,
        fullName: formData.fullName || undefined,
        email: formData.email || undefined,
        phoneNumber: formData.phone || undefined,
        title: formData.title || undefined,
      });

      if (result.success && result.employee) {
        // Update the auth store with new user data
        setUser({
          ...user,
          fullName: result.employee.fullName,
          email: result.employee.email,
          phoneNumber: result.employee.phoneNumber,
          title: result.employee.title,
        });
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          View and update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarImage src={user?.picture} />
              <AvatarFallback className="bg-[#3838EC] text-white text-xl sm:text-2xl font-semibold">
                {getInitials(user?.fullName, user?.email)}
              </AvatarFallback>
            </Avatar>
            <button
              className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Change avatar"
            >
              <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="mobile-heading font-semibold text-gray-900 dark:text-gray-100">
              {user?.fullName}
            </h3>
            <p className="mobile-text text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3838EC]/10 text-[#3838EC] dark:bg-[#3838EC]/20 mt-2">
              {user?.role ? ROLE_LABELS[user.role] : "User"}
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              disabled={!isEditing}
              className="disabled:bg-gray-50 dark:disabled:bg-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={!isEditing}
              className="disabled:bg-gray-50 dark:disabled:bg-gray-800"
              placeholder="Not set"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={!isEditing}
              className="disabled:bg-gray-50 dark:disabled:bg-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={!isEditing}
              className="disabled:bg-gray-50 dark:disabled:bg-gray-800"
              placeholder="Not set"
            />
          </div>
        </div>

        {/* Organization Info (Read-only) */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="mobile-text font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
            Organization Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="mobile-card bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Department</p>
              <p className="mobile-text font-medium text-gray-900 dark:text-gray-100">
                {user?.department?.name || "Not assigned"}
              </p>
            </div>
            <div className="mobile-card bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Employee ID</p>
              <p className="mobile-text font-medium text-gray-900 dark:text-gray-100 font-mono truncate">
                {user?.employeeId?.slice(0, 8) || "N/A"}...
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateLoading}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button onClick={handleSave} disabled={updateLoading} className="w-full sm:w-auto">
                {updateLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent sm:mr-2" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">Edit Profile</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
