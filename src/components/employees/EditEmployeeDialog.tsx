"use client";
import React, { useState, useRef, useEffect } from "react";
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
import { useEmployeeMutations } from "@/hooks/useEmployeeMutations";
import { uploadFile, validateImageFile } from "@/utils/fileUpload";
import {
  UpdateEmployeeInput,
  EmployeeRole,
  EmployeeStatus,
  Employee,
} from "@/types/graphql";

interface EditEmployeeDialogProps {
  children: React.ReactNode;
  employee: Employee;
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
}

// Helper function to parse GraphQL errors and provide user-friendly messages
const parseGraphQLError = (
  error: any
): { title: string; description: string } => {
  // Convert error to string for analysis
  const errorMessage = error?.message || error?.toString() || "";

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
    title: "Failed to Update Employee",
    description:
      "Something went wrong while updating the employee. Please try again later.",
  };
};

const EditEmployeeDialog: React.FC<EditEmployeeDialogProps> = ({
  children,
  employee,
}) => {
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
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [hasNewImage, setHasNewImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { updateEmployee, updateLoading } = useEmployeeMutations();

  // Initialize form data when employee prop changes or dialog opens
  useEffect(() => {
    if (employee && open) {
      // Format phone number (remove +251 prefix if present)
      const phoneNumber = employee.phoneNumber.startsWith("+251")
        ? employee.phoneNumber.slice(4)
        : employee.phoneNumber;

      // Format date to YYYY-MM-DD for input
      const startDate = new Date(employee.startDate)
        .toISOString()
        .split("T")[0];

      setFormData({
        fullName: employee.fullName,
        email: employee.email,
        phoneNumber: phoneNumber,
        startDate: startDate,
        role: employee.role,
        status: employee.status,
        password: "", // Always empty for editing
        picture: employee.picture,
      });

      // Set existing image preview
      if (employee.picture) {
        // Convert GCS URL to proxy URL for preview
        const imageUrl =
          employee.picture.includes("storage.googleapis.com") ||
          employee.picture.includes("storage.cloud.google.com")
            ? `/api/storage/${employee.picture.split("/").pop()}`
            : employee.picture;
        setPreviewUrl(imageUrl);
      } else {
        setPreviewUrl("");
      }

      setHasNewImage(false);
      setErrors({});
    }
  }, [employee, open]);

  // Validation function (password is optional for editing)
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

    // Password is optional for editing
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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

    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setHasNewImage(true);
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
      setHasNewImage(false);
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    setHasNewImage(false);
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

    // Prepare update input (only include changed fields)
    const input: UpdateEmployeeInput = {
      employeeId: employee.employeeId,
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      startDate: formData.startDate,
      role: formData.role,
      status: formData.status,
      picture: formData.picture,
    };

    // Only include password if it's provided
    if (formData.password.trim()) {
      input.password = formData.password;
    }

    const result = await updateEmployee(input);

    if (result.success) {
      setOpen(false);

      // Show success message
      toast.success("Employee updated successfully!", {
        description: `${formData.fullName} has been updated.`,
      });
    } else {
      // Handle error with descriptive messages
      console.error("Failed to update employee:", result.error);
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
      // Reset any uploaded files
      if (hasNewImage) {
        setUploadedFile(null);
        setHasNewImage(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[320px] sm:max-w-[700px] max-h-[80vh] overflow-y-auto m-4 mx-auto sm:my-8">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-3xl font-semibold text-center text-[#0F1327]">
            Edit Employee
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
                  className={`rounded-l-none ${
                    errors.phoneNumber ? "border-red-500" : ""
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
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
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

          {/* Row 4: Password (Optional for editing) */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="password">
              Password (leave empty to keep current)
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Enter new password (optional, min 6 characters)"
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Row 5: Profile Picture */}
          <div className="space-y-2 sm:space-y-3">
            <Label>Profile Picture</Label>
            {!previewUrl ? (
              <div
                className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors cursor-pointer ${
                  errors.picture ? "border-red-500" : "border-gray-300"
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
                {!hasNewImage && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg text-center">
                    Current Image
                  </div>
                )}
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
              disabled={updateLoading || uploading}
              className="px-6 w-full sm:w-auto order-2 sm:order-1 border border-primary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateLoading || uploading}
              className="px-6 w-full sm:w-auto bg-[#3838EC] hover:bg-[#3838EC]/90 order-1 sm:order-2"
            >
              {updateLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Employee"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;
