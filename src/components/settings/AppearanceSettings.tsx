"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Palette, Sun, Moon, Monitor, Save } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

type ThemeOption = "light" | "dark" | "system";

export default function AppearanceSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [accentColor, setAccentColor] = useState("#3838EC");

  useEffect(() => {
    setMounted(true);
    const savedAccent = localStorage.getItem("accentColor");
    if (savedAccent) {
      setAccentColor(savedAccent);
    }
  }, []);

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("accentColor", accentColor);
      toast.success("Appearance settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const themeOptions: { value: ThemeOption; label: string; icon: React.ReactNode }[] = [
    {
      value: "light",
      label: "Light",
      icon: <Sun className="h-5 w-5" />,
    },
    {
      value: "dark",
      label: "Dark",
      icon: <Moon className="h-5 w-5" />,
    },
    {
      value: "system",
      label: "System",
      icon: <Monitor className="h-5 w-5" />,
    },
  ];

  const accentColors = [
    { value: "#3838EC", name: "Indigo" },
    { value: "#0891B2", name: "Cyan" },
    { value: "#059669", name: "Emerald" },
    { value: "#DC2626", name: "Red" },
    { value: "#7C3AED", name: "Purple" },
    { value: "#EA580C", name: "Orange" },
    { value: "#0284C7", name: "Sky" },
    { value: "#65A30D", name: "Lime" },
  ];

  const currentTheme = theme as ThemeOption || "light";
  const isDark = resolvedTheme === "dark";

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 mobile-heading">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription className="mobile-text">
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={`flex flex-col items-center gap-2 sm:gap-3 mobile-card rounded-xl border-2 transition-all ${
                  currentTheme === option.value
                    ? "border-[#3838EC] dark:border-[#5b5bf7] bg-[#3838EC]/5 dark:bg-[#5b5bf7]/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {/* Theme Preview */}
                <div
                  className={`w-full aspect-video rounded-lg overflow-hidden border ${
                    option.value === "dark"
                      ? "bg-gray-900 border-gray-700"
                      : option.value === "light"
                      ? "bg-white border-gray-200"
                      : "bg-gradient-to-r from-white to-gray-900 border-gray-400"
                  }`}
                >
                  <div
                    className={`h-2 sm:h-3 ${
                      option.value === "dark"
                        ? "bg-gray-800"
                        : option.value === "light"
                        ? "bg-gray-100"
                        : "bg-gradient-to-r from-gray-100 to-gray-800"
                    }`}
                  />
                  <div className="p-1.5 sm:p-2">
                    <div
                      className={`h-1.5 sm:h-2 w-12 sm:w-16 rounded ${
                        option.value === "dark"
                          ? "bg-gray-700"
                          : option.value === "light"
                          ? "bg-gray-300"
                          : "bg-gradient-to-r from-gray-300 to-gray-700"
                      }`}
                    />
                    <div
                      className={`h-1 sm:h-1.5 w-8 sm:w-12 rounded mt-1 ${
                        option.value === "dark"
                          ? "bg-gray-600"
                          : option.value === "light"
                          ? "bg-gray-200"
                          : "bg-gradient-to-r from-gray-200 to-gray-600"
                      }`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      currentTheme === option.value
                        ? "text-[#3838EC] dark:text-[#5b5bf7]"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  >
                    {option.icon}
                  </span>
                  <span
                    className={`mobile-text font-medium ${
                      currentTheme === option.value
                        ? "text-[#3838EC] dark:text-[#5b5bf7]"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {option.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="mobile-heading">Accent Color</CardTitle>
          <CardDescription className="mobile-text">
            Choose the primary color used throughout the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                className={`group relative w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-transform hover:scale-110 ${
                  accentColor === color.value
                    ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 dark:ring-offset-gray-900"
                    : ""
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {accentColor === color.value && (
                  <svg
                    className="absolute inset-0 m-auto w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <p className="mobile-text text-gray-500 dark:text-gray-400 mt-4">
            Selected: <span className="font-medium">{accentColors.find((c) => c.value === accentColor)?.name}</span>
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent sm:mr-2" />
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Save Appearance</span>
              <span className="sm:hidden">Save</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
