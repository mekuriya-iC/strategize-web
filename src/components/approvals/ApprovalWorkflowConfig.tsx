"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings,
  CheckCircle,
  ArrowRight,
  Users,
  Building2,
  User,
  Shield,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface ApprovalWorkflowConfigProps {
  onSave?: (config: WorkflowConfig) => void;
}

interface WorkflowConfig {
  autoApproveForAdmins: boolean;
  requireComments: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  cascadeApproval: boolean;
  allowBulkActions: boolean;
}

export default function ApprovalWorkflowConfig({
  onSave,
}: ApprovalWorkflowConfigProps) {
  const [config, setConfig] = useState<WorkflowConfig>({
    autoApproveForAdmins: true,
    requireComments: false,
    notifyOnApproval: true,
    notifyOnRejection: true,
    cascadeApproval: true,
    allowBulkActions: true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (key: keyof WorkflowConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(config);
    toast.success("Workflow configuration saved successfully");
    setHasChanges(false);
  };

  const handleReset = () => {
    setConfig({
      autoApproveForAdmins: true,
      requireComments: false,
      notifyOnApproval: true,
      notifyOnRejection: true,
      cascadeApproval: true,
      allowBulkActions: true,
    });
    setHasChanges(false);
    toast.info("Configuration reset to defaults");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Approval Workflow Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure how approvals work in your organization
        </p>
      </div>

      {/* Approval Hierarchy Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval Hierarchy</CardTitle>
          <CardDescription>
            Multi-level approval chain based on organizational structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Corporate Level */}
            <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Corporate Level
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SUPER_ADMIN / ADMIN - Final approval authority
                </p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                Level 4
              </Badge>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
            </div>

            {/* Division Level */}
            <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-full">
                <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Division Level
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  DIRECTOR - Approves division objectives
                </p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Level 3
              </Badge>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
            </div>

            {/* Department Level */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Department Level
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  MANAGER - Approves department objectives
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Level 2
              </Badge>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
            </div>

            {/* Personnel Level */}
            <div className="flex items-center gap-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900/40 rounded-full">
                <User className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Personnel Level
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  EMPLOYEE - Submits personal objectives
                </p>
              </div>
              <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                Level 1
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow Settings</CardTitle>
          <CardDescription>
            Customize approval behavior and requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-approve for Admins */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-approve" className="text-base font-medium">
                Auto-approve for Admins
              </Label>
              <p className="text-sm text-gray-500">
                SUPER_ADMIN and ADMIN submissions are automatically approved
              </p>
            </div>
            <Switch
              id="auto-approve"
              checked={config.autoApproveForAdmins}
              onCheckedChange={() => handleToggle("autoApproveForAdmins")}
            />
          </div>

          {/* Require Comments */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-comments" className="text-base font-medium">
                Require Comments
              </Label>
              <p className="text-sm text-gray-500">
                Approvers must provide a comment when approving
              </p>
            </div>
            <Switch
              id="require-comments"
              checked={config.requireComments}
              onCheckedChange={() => handleToggle("requireComments")}
            />
          </div>

          {/* Notify on Approval */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-approval" className="text-base font-medium">
                Notify on Approval
              </Label>
              <p className="text-sm text-gray-500">
                Send notification when submission is approved
              </p>
            </div>
            <Switch
              id="notify-approval"
              checked={config.notifyOnApproval}
              onCheckedChange={() => handleToggle("notifyOnApproval")}
            />
          </div>

          {/* Notify on Rejection */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-rejection" className="text-base font-medium">
                Notify on Rejection
              </Label>
              <p className="text-sm text-gray-500">
                Send notification when submission is rejected
              </p>
            </div>
            <Switch
              id="notify-rejection"
              checked={config.notifyOnRejection}
              onCheckedChange={() => handleToggle("notifyOnRejection")}
            />
          </div>

          {/* Cascade Approval */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cascade-approval" className="text-base font-medium">
                Cascade Approval
              </Label>
              <p className="text-sm text-gray-500">
                Approving an objective also approves its KPIs
              </p>
            </div>
            <Switch
              id="cascade-approval"
              checked={config.cascadeApproval}
              onCheckedChange={() => handleToggle("cascadeApproval")}
            />
          </div>

          {/* Allow Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bulk-actions" className="text-base font-medium">
                Allow Bulk Actions
              </Label>
              <p className="text-sm text-gray-500">
                Enable bulk approve/reject for multiple submissions
              </p>
            </div>
            <Switch
              id="bulk-actions"
              checked={config.allowBulkActions}
              onCheckedChange={() => handleToggle("allowBulkActions")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-2">How Approval Workflow Works</p>
              <ul className="space-y-1 list-disc list-inside text-blue-800 dark:text-blue-200">
                <li>Employees submit personnel objectives to their manager</li>
                <li>Managers submit department objectives to their director</li>
                <li>Directors submit division objectives to corporate (SUPER_ADMIN/ADMIN)</li>
                <li>Each level can approve or reject with comments</li>
                <li>Rejected submissions can be revised and resubmitted</li>
                <li>Approved objectives can have KPIs assigned</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
