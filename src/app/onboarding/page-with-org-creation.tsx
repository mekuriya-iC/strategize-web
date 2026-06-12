"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Building2, Target, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useApolloClient } from "@apollo/client";
import { gql } from "@apollo/client";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { useAuthStore } from "@/stores/authStore";

const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($createOrganizationInput: CreateOrganizationInput!) {
    createOrganization(createOrganizationInput: $createOrganizationInput) {
      organizationId
      name
      shortName
    }
  }
`;

const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {
    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {
      employeeId
      organizationId
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization(
    $updateOrganizationInput: UpdateOrganizationInput!
  ) {
    updateOrganization(updateOrganizationInput: $updateOrganizationInput) {
      organizationId
      onboardingCompleted
      structureTemplate
    }
  }
`;

export default function OnboardingPage() {
  const router = useRouter();
  const apolloClient = useApolloClient();
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const [step, setStep] = useState(1);
  const [organizationData, setOrganizationData] = useState({
    name: "",
    shortName: "",
    country: "",
    city: "",
    industry: "",
  });
  const [passwordData, setPasswordData] = useState({
    old: "",
    new: "",
    confirm: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const [createOrganization] = useMutation(CREATE_ORGANIZATION);
  const [updateEmployee] = useMutation(UPDATE_EMPLOYEE);
  const [changePassword] = useMutation(CHANGE_PASSWORD);
  const [updateOrg] = useMutation(UPDATE_ORGANIZATION);

  useEffect(() => {
    console.log("🎯 Onboarding page loaded");
    console.log("👤 User:", user);
  }, [user]);

  // Check if user needs organization creation
  const needsOrgCreation = (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && !user?.organizationId;

  // Only SUPER_ADMIN and ADMIN see template selection
  const isSuperAdminOrAdmin =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  // Calculate total steps based on user role and org status
  let totalSteps = 2; // Default: password + complete
  if (needsOrgCreation) {
    totalSteps = 4; // org + password + template + complete
  } else if (isSuperAdminOrAdmin) {
    totalSteps = 3; // password + template + complete
  }

  const templates = [
    {
      id: "functional",
      name: "Functional",
      icon: Building2,
      desc: "Organized by function (HR, Finance, Sales)",
    },
    {
      id: "divisional",
      name: "Divisional",
      icon: Target,
      desc: "Organized by division/region",
    },
    {
      id: "matrix",
      name: "Matrix",
      icon: Calendar,
      desc: "Cross-functional teams",
    },
    { id: "flat", name: "Flat", icon: CheckCircle2, desc: "Minimal hierarchy" },
  ];

  const handleOrganizationCreate = async () => {
    if (!organizationData.name) {
      toast.error("Organization name is required");
      return;
    }

    if (!organizationData.country || !organizationData.city) {
      toast.error("Country and city are required");
      return;
    }

    try {
      // Create organization
      const { data } = await createOrganization({
        variables: {
          createOrganizationInput: {
            name: organizationData.name,
            shortName: organizationData.shortName || undefined,
            country: organizationData.country,
            city: organizationData.city,
            industry: organizationData.industry || undefined,
          },
        },
      });

      const orgId = data.createOrganization.organizationId;

      // Update employee with organization ID
      await updateEmployee({
        variables: {
          updateEmployeeInput: {
            employeeId: user?.employeeId,
            organizationId: orgId,
          },
        },
      });

      // Refresh user data
      const { data: meData } = await apolloClient.query({
        query: GET_ME,
        fetchPolicy: "network-only",
      });

      if (meData?.me) {
        setUser(meData.me);
      }

      toast.success("Organization created successfully");
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Failed to create organization");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await changePassword({
        variables: {
          input: {
            oldPassword: passwordData.old,
            newPassword: passwordData.new,
          },
        },
      });

      const { data: meData } = await apolloClient.query({
        query: GET_ME,
        fetchPolicy: "network-only",
      });

      if (meData?.me) {
        setUser(meData.me);
      } else if (user) {
        setUser(user);
      }

      toast.success("Password changed successfully");

      // Move to next step or redirect
      if (isSuperAdminOrAdmin) {
        setStep(step + 1);
      } else {
        // Regular users skip template selection
        setStep(totalSteps);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    }
  };

  const handleTemplateSelect = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    try {
      await updateOrg({
        variables: {
          updateOrganizationInput: {
            organizationId: user?.organizationId,
            structureTemplate: selectedTemplate,
          },
        },
      });
      toast.success("Template selected");
      setStep(totalSteps);
    } catch (error: any) {
      toast.error(error.message || "Failed to save template");
    }
  };

  const completeOnboarding = async () => {
    try {
      // Only SUPER_ADMIN can mark org onboarding as complete
      if (isSuperAdminOrAdmin) {
        await updateOrg({
          variables: {
            updateOrganizationInput: {
              organizationId: user?.organizationId,
              onboardingCompleted: true,
            },
          },
        });
      }
      toast.success("Setup complete!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding");
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Welcome to Strategize</CardTitle>
            <span className="text-sm text-gray-500">
              Step {step} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Create Organization (for Super Admin/Admin without org) */}
          {step === 1 && needsOrgCreation && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Building2 className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Create Your Organization
                </h3>
                <p className="text-gray-600">
                  Let's start by setting up your organization profile
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="orgName">
                    Organization Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="orgName"
                    placeholder="e.g., Acme Corporation"
                    value={organizationData.name}
                    onChange={(e) =>
                      setOrganizationData({ ...organizationData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shortName">Short Name</Label>
                  <Input
                    id="shortName"
                    placeholder="e.g., Acme"
                    value={organizationData.shortName}
                    onChange={(e) =>
                      setOrganizationData({ ...organizationData, shortName: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="country"
                      placeholder="e.g., Ethiopia"
                      value={organizationData.country}
                      onChange={(e) =>
                        setOrganizationData({ ...organizationData, country: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="e.g., Addis Ababa"
                      value={organizationData.city}
                      onChange={(e) =>
                        setOrganizationData({ ...organizationData, city: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Technology, Healthcare, Finance"
                    value={organizationData.industry}
                    onChange={(e) =>
                      setOrganizationData({ ...organizationData, industry: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleOrganizationCreate} className="w-full">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Password Change Step */}
          {((step === 1 && !needsOrgCreation) || (step === 2 && needsOrgCreation)) && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">
                  Change Your Password
                </h3>
                <p className="text-gray-600">
                  Please set a new password for security
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={passwordData.old}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, old: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm: e.target.value,
                      })
                    }
                  />
                </div>
                <Button onClick={handlePasswordChange} className="w-full">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Template Selection Step */}
          {isSuperAdminOrAdmin &&
            ((step === 2 && !needsOrgCreation) || (step === 3 && needsOrgCreation)) && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Choose Organization Structure
                  </h3>
                  <p className="text-gray-600">
                    Select the structure that best fits your organization
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-6 border-2 rounded-lg text-left transition-all ${
                        selectedTemplate === template.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      <template.icon className="h-8 w-8 mb-3 text-indigo-600" />
                      <h4 className="font-semibold mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-600">{template.desc}</p>
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleTemplateSelect}
                  className="w-full"
                  disabled={!selectedTemplate}
                >
                  Continue
                </Button>
              </div>
            )}

          {/* Complete Step */}
          {step === totalSteps && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
                <p className="text-gray-600">
                  {isSuperAdminOrAdmin
                    ? "You can now access your dashboard and complete the remaining setup steps"
                    : "Your password has been changed. You can now access the dashboard."}
                </p>
              </div>
              {isSuperAdminOrAdmin && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Next Steps:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Create Strategic Plan & Pillars</li>
                    <li>✓ Build Organization Structure</li>
                    <li>✓ Add Employees & Positions</li>
                    <li>✓ Set Corporate Objectives & KPIs</li>
                  </ul>
                </div>
              )}
              <Button onClick={completeOnboarding} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
