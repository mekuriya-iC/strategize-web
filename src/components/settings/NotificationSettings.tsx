"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Mail, Smartphone, Save } from "lucide-react";
import { toast } from "sonner";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

export default function NotificationSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "approvals",
      label: "Approval Requests",
      description: "When someone submits an objective or KPI for your approval",
      email: true,
      push: true,
    },
    {
      id: "submissions",
      label: "Submission Updates",
      description: "When your submissions are approved or rejected",
      email: true,
      push: true,
    },
    {
      id: "assignments",
      label: "New Assignments",
      description: "When new objectives or KPIs are assigned to you",
      email: true,
      push: false,
    },
    {
      id: "deadlines",
      label: "Deadline Reminders",
      description: "Reminders for upcoming submission deadlines",
      email: true,
      push: true,
    },
    {
      id: "reports",
      label: "Report Updates",
      description: "Weekly and monthly performance report summaries",
      email: false,
      push: false,
    },
    {
      id: "announcements",
      label: "System Announcements",
      description: "Important updates and announcements from administrators",
      email: true,
      push: false,
    },
  ]);

  const handleToggle = (
    settingId: string,
    channel: "email" | "push",
    value: boolean
  ) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.id === settingId ? { ...s, [channel]: value } : s
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement actual API call to save notification preferences
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how and when you want to be notified
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Channel Headers */}
        <div className="flex items-center justify-end gap-8 mb-4 pr-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4" />
            Email
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <Smartphone className="h-4 w-4" />
            Push
          </div>
        </div>

        {/* Notification Items */}
        <div className="space-y-1">
          {settings.map((setting, index) => (
            <div
              key={setting.id}
              className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""
              }`}
            >
              <div className="flex-1 pr-4">
                <Label
                  htmlFor={`${setting.id}-email`}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                  {setting.label}
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {setting.description}
                </p>
              </div>
              <div className="flex items-center gap-12">
                <div className="flex items-center justify-center w-8">
                  <Checkbox
                    id={`${setting.id}-email`}
                    checked={setting.email}
                    onCheckedChange={(checked) =>
                      handleToggle(setting.id, "email", checked as boolean)
                    }
                  />
                </div>
                <div className="flex items-center justify-center w-8">
                  <Checkbox
                    id={`${setting.id}-push`}
                    checked={setting.push}
                    onCheckedChange={(checked) =>
                      handleToggle(setting.id, "push", checked as boolean)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSettings((prev) =>
                  prev.map((s) => ({ ...s, email: true, push: true }))
                )
              }
            >
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSettings((prev) =>
                  prev.map((s) => ({ ...s, email: false, push: false }))
                )
              }
            >
              Disable All
            </Button>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

