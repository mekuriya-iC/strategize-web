"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ProfileSettings,
  SecuritySettings,
  NotificationSettings,
  AppearanceSettings,
} from "@/components/settings";
import { User, Shield, Bell, Palette } from "lucide-react";

type SettingsTab = "profile" | "security" | "notifications" | "appearance";

const validTabs: SettingsTab[] = ["profile", "security", "notifications", "appearance"];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as SettingsTab | null;
  
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      return tabParam;
    }
    return "profile";
  });

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const tab = value as SettingsTab;
    setActiveTab(tab);
    router.push(`/dashboard/settings?tab=${tab}`, { scroll: false });
  };

  // Sync with URL param changes
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const tabs = [
    {
      id: "profile" as const,
      label: "Profile",
      icon: <User className="h-4 w-4" />,
      component: <ProfileSettings />,
    },
    {
      id: "security" as const,
      label: "Security",
      icon: <Shield className="h-4 w-4" />,
      component: <SecuritySettings />,
    },
    {
      id: "notifications" as const,
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
      component: <NotificationSettings />,
    },
    {
      id: "appearance" as const,
      label: "Appearance",
      icon: <Palette className="h-4 w-4" />,
      component: <AppearanceSettings />,
    },
  ];

  return (
    <div className="min-h-[70vh] p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Content */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col lg:flex-row gap-8"
      >
        {/* Sidebar Navigation */}
        <div className="lg:w-64 shrink-0">
          <TabsList className="flex lg:flex-col w-full h-auto bg-transparent gap-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="w-full justify-start gap-3 px-4 py-3 text-left rounded-lg data-[state=active]:bg-[#3838EC]/10 data-[state=active]:text-[#3838EC] data-[state=active]:shadow-none hover:bg-gray-100 transition-colors"
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Help Card */}
          <div className="hidden lg:block mt-8 p-4 bg-gradient-to-br from-[#3838EC]/10 to-[#3838EC]/5 rounded-xl border border-[#3838EC]/20">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              If you have questions about your account or settings, our support
              team is here to help.
            </p>
            <a
              href="mailto:support@icapitalafrica.com"
              className="text-sm font-medium text-[#3838EC] hover:underline"
            >
              Contact Support →
            </a>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              {tab.component}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] p-6 animate-pulse"><div className="h-8 w-32 bg-gray-200 rounded mb-4" /><div className="h-64 bg-gray-100 rounded" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

