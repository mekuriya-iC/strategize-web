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

type ThemeOption = "light" | "dark" | "system";

export default function AppearanceSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<ThemeOption>("light");
  const [accentColor, setAccentColor] = useState("#3838EC");

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") as ThemeOption | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedAccent = localStorage.getItem("accentColor");
    if (savedAccent) {
      setAccentColor(savedAccent);
    }
  }, []);

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    // Apply theme immediately for preview
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("theme", theme);
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

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  theme === option.value
                    ? "border-[#3838EC] bg-[#3838EC]/5"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
                    className={`h-3 ${
                      option.value === "dark"
                        ? "bg-gray-800"
                        : option.value === "light"
                        ? "bg-gray-100"
                        : "bg-gradient-to-r from-gray-100 to-gray-800"
                    }`}
                  />
                  <div className="p-2">
                    <div
                      className={`h-2 w-16 rounded ${
                        option.value === "dark"
                          ? "bg-gray-700"
                          : option.value === "light"
                          ? "bg-gray-300"
                          : "bg-gradient-to-r from-gray-300 to-gray-700"
                      }`}
                    />
                    <div
                      className={`h-1.5 w-12 rounded mt-1 ${
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
                      theme === option.value ? "text-[#3838EC]" : "text-gray-600"
                    }
                  >
                    {option.icon}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      theme === option.value ? "text-[#3838EC]" : "text-gray-700"
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
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>
            Choose the primary color used throughout the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                className={`group relative w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                  accentColor === color.value
                    ? "ring-2 ring-offset-2 ring-gray-400"
                    : ""
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {accentColor === color.value && (
                  <svg
                    className="absolute inset-0 m-auto w-6 h-6 text-white"
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
          <p className="text-sm text-gray-500 mt-4">
            Selected: <span className="font-medium">{accentColors.find((c) => c.value === accentColor)?.name}</span>
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Appearance
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

