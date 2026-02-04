"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores";
import { useEmployeeMutations } from "@/hooks/employees/useEmployeeMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Eye, EyeOff, Key, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function SecuritySettings() {
  const user = useAuthStore((state) => state.user);
  const { updateEmployee, updateLoading } = useEmployeeMutations();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    if (!user?.employeeId) {
      toast.error("Unable to change password: User not found");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      const result = await updateEmployee({
        employeeId: user.employeeId,
        password: passwordForm.newPassword,
      });

      if (result.success) {
        toast.success(
          "Password changed successfully. Please use your new password on next login."
        );
        setPasswordForm({
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const errorMessage =
          result.error instanceof Error
            ? result.error.message
            : "Failed to change password";
        toast.error(errorMessage);
      }
    } catch {
      toast.error("Failed to change password. Please try again.");
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Weak", color: "bg-red-500" };
    if (strength <= 3)
      return { strength, label: "Medium", color: "bg-yellow-500" };
    if (strength <= 4)
      return { strength, label: "Strong", color: "bg-green-500" };
    return { strength, label: "Very Strong", color: "bg-emerald-600" };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Important</p>
              <p>
                After changing your password, you will need to use the new
                password on your next login.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {/* Password Strength Indicator */}
            {passwordForm.newPassword && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${level <= passwordStrength.strength
                          ? passwordStrength.color
                          : "bg-gray-200"
                        }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs ${passwordStrength.strength <= 2
                      ? "text-red-600"
                      : passwordStrength.strength <= 3
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                >
                  {passwordStrength.label}
                </p>
              </div>
            )}
            {/* Password Requirements */}
            <div className="text-xs text-gray-500 space-y-1 mt-2">
              <p className="font-medium">Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li
                  className={
                    passwordForm.newPassword.length >= 8 ? "text-green-600" : ""
                  }
                >
                  At least 8 characters
                </li>
                <li
                  className={
                    /[A-Z]/.test(passwordForm.newPassword)
                      ? "text-green-600"
                      : ""
                  }
                >
                  One uppercase letter
                </li>
                <li
                  className={
                    /[a-z]/.test(passwordForm.newPassword)
                      ? "text-green-600"
                      : ""
                  }
                >
                  One lowercase letter
                </li>
                <li
                  className={
                    /[0-9]/.test(passwordForm.newPassword)
                      ? "text-green-600"
                      : ""
                  }
                >
                  One number
                </li>
                <li
                  className={
                    /[^A-Za-z0-9]/.test(passwordForm.newPassword)
                      ? "text-green-600"
                      : ""
                  }
                >
                  One special character
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordForm.confirmPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
            {passwordForm.confirmPassword &&
              passwordForm.newPassword === passwordForm.confirmPassword &&
              passwordForm.confirmPassword.length >= 8 && (
                <p className="text-xs text-green-600">Passwords match ✓</p>
              )}
          </div>

          <div className="pt-2">
            <Button
              onClick={handleChangePassword}
              disabled={
                updateLoading ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword ||
                passwordForm.newPassword !== passwordForm.confirmPassword ||
                passwordForm.newPassword.length < 8
              }
            >
              {updateLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>Overview of your account security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">
                    Account Protected
                  </p>
                  <p className="text-sm text-green-700">
                    Your account is secured with a password
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Password Security</p>
                  <p className="text-sm text-gray-600">
                    We recommend changing your password every 90 days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
