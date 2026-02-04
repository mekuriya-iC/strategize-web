"use client";
import React, { useState, useRef } from "react";
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
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEmployeeMutations } from "@/hooks/employees/useEmployeeMutations";
import { uploadFile, validateImageFile } from "@/utils/fileUpload";
import {
  CreateEmployeeInput,
  EmployeeRole,
  EmployeeStatus,
} from "@/types/graphql";

interface AddEmployeeDialogProps {
  children: React.ReactNode;
}

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  startDate: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  password: string;
  picture: string;
  title: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  startDate?: string;
  role?: string;
  status?: string;
  password?: string;
  picture?: string;
  title?: string;
}

// Helper function to parse GraphQL errors and provide user-friendly messages
const parseGraphQLError = (
  error: unknown
): { title: string; description: string } => {
  // Convert error to string for analysis
  const errorMessage =
    (error instanceof Error ? error.message : error?.toString()) || "";

  // Check for duplicate key constraint violations
  if (errorMessage.includes("duplicate key value violates unique constraint")) {
    if (
      errorMessage.includes("email") ||
      errorMessage.toLowerCase().includes("uq_")
    ) {
      return {
        title: "Email Already Exists",
        description:
          "This email address is already registered. Please use a different email address.",
      };
    }
    if (errorMessage.includes("phone")) {
      return {
        title: "Phone Number Already Exists",
        description:
          "This phone number is already registered. Please use a different phone number.",
      };
    }
    return {
      title: "Duplicate Information",
      description:
        "Some of the information you entered already exists in the system. Please check your entries.",
    };
  }

  // Check for validation errors
  if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
    return {
      title: "Invalid Information",
      description:
        "Please check your entries and make sure all information is valid.",
    };
  }

  // Check for network errors
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return {
      title: "Connection Error",
      description:
        "Unable to connect to the server. Please check your internet connection and try again.",
    };
  }

  // Check for authorization errors
  if (
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("forbidden")
  ) {
    return {
      title: "Permission Denied",
      description:
        "You don't have permission to perform this action. Please contact your administrator.",
    };
  }

  // Default error message
  return {
    title: "Failed to Create Employee",
    description:
      "Something went wrong while creating the employee. Please try again later.",
  };
};

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    startDate: "",
    role: "NORMAL",
    status: "ACTIVE",
    password: "",
    picture: "",
    title: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createEmployee, createLoading } = useEmployeeMutations();

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 9 digits";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle file upload
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, picture: validation.error }));
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, picture: undefined }));

    // Upload file
    setUploading(true);
    try {
      const uploadResult = await uploadFile(file);
      setFormData((prev) => ({ ...prev, picture: uploadResult.url }));
    } catch (error) {
      console.error("Upload failed:", error);
      setErrors((prev) => ({
        ...prev,
        picture: "Upload failed. Please try again.",
      }));
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setPreviewUrl("");
    setFormData((prev) => ({ ...prev, picture: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const input: CreateEmployeeInput = {
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      startDate: formData.startDate,
      role: formData.role,
      status: formData.status,
      password: formData.password,
      picture: formData.picture,
      title: formData.title,
    };

    const result = await createEmployee(input);

    if (result.success) {
      // Reset form and close dialog
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        startDate: "",
        role: "NORMAL",
        status: "ACTIVE",
        password: "",
        picture: "",
        title: "",
      });
      setErrors({});
      removeFile();
      setOpen(false);

      // Show success message
      toast.success("Employee Added Successfully!", {
        description: `${formData.fullName} has been added to the system.`,
      });
    } else {
      // Handle error with descriptive messages
      console.error("Failed to create employee:", result.error);
      const errorInfo = parseGraphQLError(result.error);
      toast.error(errorInfo.title, {
        description: errorInfo.description,
      });
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        startDate: "",
        role: "NORMAL",
        status: "ACTIVE",
        password: "",
        picture: "",
        title: "",
      });
      setErrors({});
      removeFile();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[320px] sm:max-w-[700px] max-h-[80vh] overflow-y-auto m-4 mx-auto sm:my-8">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-3xl font-semibold text-center text-[#0F1327]">
            Add Employee
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 sm:space-y-8 mt-4 sm:mt-6"
        >
          {/* Row 1: Full Name and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="Enter full name"
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Row 2: Phone Number and Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-sm text-gray-600">
                  +251
                </div>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="912345678"
                  className={`rounded-l-none ${errors.phoneNumber ? "border-red-500" : ""
                    }`}
                  maxLength={9}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>
          </div>

          {/* Row 3: Role and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: EmployeeRole) =>
                  handleInputChange("role", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Employee</SelectItem>
                  <SelectItem value="COORDINATOR">Coordinator</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="DIRECTOR">Director</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: EmployeeStatus) =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                  <SelectItem value="DELETED">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Title */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter job title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Row 5: Password */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Enter password (min 6 characters)"
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Row 6: Profile Picture */}
          <div className="space-y-2 sm:space-y-3">
            <Label>Profile Picture</Label>
            {!previewUrl ? (
              <div
                className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors cursor-pointer ${errors.picture ? "border-red-500" : "border-gray-300"
                  }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-600">
                  Click to upload profile picture
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, WebP up to 5MB
                </p>
                {uploading && (
                  <div className="flex items-center justify-center mt-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {errors.picture && (
              <p className="text-sm text-red-500">{errors.picture}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={createLoading || uploading}
              className="px-6 w-full sm:w-auto order-2 sm:order-1 border border-primary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createLoading || uploading}
              className="px-6 w-full sm:w-auto bg-[#3838EC] hover:bg-[#3838EC]/90 order-1 sm:order-2"
            >
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Add Employee"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
