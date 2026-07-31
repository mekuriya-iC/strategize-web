"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSystemConfigurationByOrg,
  useSystemConfigurationMutations,
  type KpiTargetRangeOutsidePolicy,
} from "@/hooks/systemConfiguration/useSystemConfiguration";
import { Settings, Clock, Calendar, Star, Mail, FileText, Users, Loader2, Save, Database, TrendingUp, Calculator } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import FixAssigneeType from "@/components/admin/FixAssigneeType";
import WeightConfigManager from "@/components/performance/WeightConfigManager";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Australia/Sydney",
];

export default function SystemConfigPage() {
  const { user } = useAuth();
  // TODO: Get organizationId from proper source when organization field is added to Employee type
  const organizationId = user?.organizationId || "";
  
  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const { configuration, loading, refetch } = useSystemConfigurationByOrg(organizationId);
  const { createConfiguration, updateConfiguration, loading: mutationLoading } =
    useSystemConfigurationMutations();

  // Form state
  const [timezone, setTimezone] = useState("UTC");
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(1);
  const [defaultRatingScaleMin, setDefaultRatingScaleMin] = useState(1);
  const [defaultRatingScaleMax, setDefaultRatingScaleMax] = useState(5);
  const [checkinDayOfWeek, setCheckinDayOfWeek] = useState(1);
  const [checkoutDayOfWeek, setCheckoutDayOfWeek] = useState(5);
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(true);
  const [enableSharedKpis, setEnableSharedKpis] = useState(true);
  const [enableLogbookAttachments, setEnableLogbookAttachments] = useState(true);
  const [enableFormulaKpis, setEnableFormulaKpis] = useState(false);
  const [defaultKpiZeroDenominatorPolicy, setDefaultKpiZeroDenominatorPolicy] =
    useState<"NOT_CALCULABLE" | "ZERO" | "BLOCK">("NOT_CALCULABLE");
  const [defaultKpiResultDirection, setDefaultKpiResultDirection] =
    useState<"HIGHER_IS_BETTER" | "LOWER_IS_BETTER" | "TARGET_RANGE">(
      "HIGHER_IS_BETTER",
    );
  const [
    defaultKpiTargetRangeOutsidePolicy,
    setDefaultKpiTargetRangeOutsidePolicy,
  ] = useState<KpiTargetRangeOutsidePolicy>("ZERO_OUTSIDE");
  const [hasChanges, setHasChanges] = useState(false);

  // Load configuration when available
  useEffect(() => {
    if (configuration) {
      setTimezone(configuration.timezone);
      setFiscalYearStartMonth(configuration.fiscalYearStartMonth);
      setDefaultRatingScaleMin(configuration.defaultRatingScaleMin);
      setDefaultRatingScaleMax(configuration.defaultRatingScaleMax);
      setCheckinDayOfWeek(configuration.checkinDayOfWeek);
      setCheckoutDayOfWeek(configuration.checkoutDayOfWeek);
      setEnableEmailNotifications(configuration.enableEmailNotifications);
      setEnableSharedKpis(configuration.enableSharedKpis);
      setEnableLogbookAttachments(configuration.enableLogbookAttachments);
      setEnableFormulaKpis(configuration.enableFormulaKpis ?? false);
      setDefaultKpiZeroDenominatorPolicy(
        configuration.defaultKpiZeroDenominatorPolicy ?? "NOT_CALCULABLE",
      );
      setDefaultKpiResultDirection(
        configuration.defaultKpiResultDirection ?? "HIGHER_IS_BETTER",
      );
      setDefaultKpiTargetRangeOutsidePolicy(
        configuration.defaultKpiTargetRangeOutsidePolicy ?? "ZERO_OUTSIDE",
      );
    }
  }, [configuration]);

  // Track changes
  useEffect(() => {
    if (!configuration) {
      setHasChanges(true); // New configuration
      return;
    }

    const changed =
      timezone !== configuration.timezone ||
      fiscalYearStartMonth !== configuration.fiscalYearStartMonth ||
      defaultRatingScaleMin !== configuration.defaultRatingScaleMin ||
      defaultRatingScaleMax !== configuration.defaultRatingScaleMax ||
      checkinDayOfWeek !== configuration.checkinDayOfWeek ||
      checkoutDayOfWeek !== configuration.checkoutDayOfWeek ||
      enableEmailNotifications !== configuration.enableEmailNotifications ||
      enableSharedKpis !== configuration.enableSharedKpis ||
      enableLogbookAttachments !== configuration.enableLogbookAttachments ||
      enableFormulaKpis !== (configuration.enableFormulaKpis ?? false) ||
      defaultKpiZeroDenominatorPolicy !==
        (configuration.defaultKpiZeroDenominatorPolicy ?? "NOT_CALCULABLE") ||
      defaultKpiResultDirection !==
        (configuration.defaultKpiResultDirection ?? "HIGHER_IS_BETTER") ||
      defaultKpiTargetRangeOutsidePolicy !==
        (configuration.defaultKpiTargetRangeOutsidePolicy ?? "ZERO_OUTSIDE");

    setHasChanges(changed);
  }, [
    configuration,
    timezone,
    fiscalYearStartMonth,
    defaultRatingScaleMin,
    defaultRatingScaleMax,
    checkinDayOfWeek,
    checkoutDayOfWeek,
    enableEmailNotifications,
    enableSharedKpis,
    enableLogbookAttachments,
    enableFormulaKpis,
    defaultKpiZeroDenominatorPolicy,
    defaultKpiResultDirection,
    defaultKpiTargetRangeOutsidePolicy,
  ]);

  const handleSave = async () => {
    // Skip organization-specific settings if no org ID
    if (!organizationId) {
      toast.warning("Cannot save system configuration without an organization ID.");
      return;
    }

    const input = {
      timezone,
      fiscalYearStartMonth,
      defaultRatingScaleMin,
      defaultRatingScaleMax,
      checkinDayOfWeek,
      checkoutDayOfWeek,
      enableEmailNotifications,
      enableSharedKpis,
      enableLogbookAttachments,
      enableFormulaKpis,
      defaultKpiZeroDenominatorPolicy,
      defaultKpiResultDirection,
      defaultKpiTargetRangeOutsidePolicy,
    };

    if (configuration) {
      await updateConfiguration({
        systemConfigurationId: configuration.systemConfigurationId,
        ...input,
      });
    } else {
      await createConfiguration({
        organizationId,
        ...input,
      });
    }

    refetch();
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const isSaving = mutationLoading.create || mutationLoading.update;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            System Configuration
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage organization-wide system settings and preferences
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving || !organizationId}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      {/* Warning if no organization ID */}
      {!organizationId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">
            ⚠️ No Organization ID
          </h3>
          <p className="text-xs text-yellow-700">
            Your user account doesn't have an organization ID set. System configuration settings cannot be saved, but you can still use the Data Management tools below.
          </p>
        </div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>Basic system configuration and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Default timezone for the organization</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fiscal Year Start Month
              </Label>
              <Select
                value={fiscalYearStartMonth.toString()}
                onValueChange={(v) => setFiscalYearStartMonth(parseInt(v))}
              >
                <SelectTrigger id="fiscalYear">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Month when fiscal year begins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Scale Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            <CardTitle>Rating Scale Settings</CardTitle>
          </div>
          <CardDescription>Configure default rating scale for evaluations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="ratingMin">Minimum Rating</Label>
              <Input
                id="ratingMin"
                type="number"
                min="1"
                max="10"
                value={defaultRatingScaleMin}
                onChange={(e) => setDefaultRatingScaleMin(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-500">Lowest possible rating value</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratingMax">Maximum Rating</Label>
              <Input
                id="ratingMax"
                type="number"
                min="1"
                max="10"
                value={defaultRatingScaleMax}
                onChange={(e) => setDefaultRatingScaleMax(parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-gray-500">Highest possible rating value</p>
            </div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Current scale: {defaultRatingScaleMin} to {defaultRatingScaleMax} (
              {defaultRatingScaleMax - defaultRatingScaleMin + 1} points)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Check-in/Check-out Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            <CardTitle>Check-in/Check-out Settings</CardTitle>
          </div>
          <CardDescription>Configure weekly check-in and check-out schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="checkinDay">Check-in Day</Label>
              <Select
                value={checkinDayOfWeek.toString()}
                onValueChange={(v) => setCheckinDayOfWeek(parseInt(v))}
              >
                <SelectTrigger id="checkinDay">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Day of week for check-ins</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkoutDay">Check-out Day</Label>
              <Select
                value={checkoutDayOfWeek.toString()}
                onValueChange={(v) => setCheckoutDayOfWeek(parseInt(v))}
              >
                <SelectTrigger id="checkoutDay">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Day of week for check-outs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            <CardTitle>Feature Toggles</CardTitle>
          </div>
          <CardDescription>Enable or disable system features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <Label htmlFor="emailNotif" className="text-base font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-500">Send email notifications to users</p>
              </div>
            </div>
            <Switch
              id="emailNotif"
              checked={enableEmailNotifications}
              onCheckedChange={setEnableEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <Label htmlFor="sharedKpis" className="text-base font-medium">
                  Shared KPIs
                </Label>
                <p className="text-sm text-gray-500">Allow KPIs to be shared across employees</p>
              </div>
            </div>
            <Switch
              id="sharedKpis"
              checked={enableSharedKpis}
              onCheckedChange={setEnableSharedKpis}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <Label htmlFor="logbookAttach" className="text-base font-medium">
                  Logbook Attachments
                </Label>
                <p className="text-sm text-gray-500">Allow file attachments in logbook entries</p>
              </div>
            </div>
            <Switch
              id="logbookAttach"
              checked={enableLogbookAttachments}
              onCheckedChange={setEnableLogbookAttachments}
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-indigo-600" />
                <div>
                  <Label htmlFor="formulaKpis" className="text-base font-medium">
                    Formula KPIs
                  </Label>
                  <p className="text-sm text-gray-500">
                    Enable versioned numerator/denominator formulas and reusable metric drivers.
                  </p>
                </div>
              </div>
              <Switch
                id="formulaKpis"
                checked={enableFormulaKpis}
                onCheckedChange={setEnableFormulaKpis}
              />
            </div>

            {enableFormulaKpis && (
              <div className="grid gap-4 border-t pt-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Default zero-denominator behavior</Label>
                  <Select
                    value={defaultKpiZeroDenominatorPolicy}
                    onValueChange={(value) =>
                      setDefaultKpiZeroDenominatorPolicy(
                        value as "NOT_CALCULABLE" | "ZERO" | "BLOCK",
                      )
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_CALCULABLE">Show not calculable</SelectItem>
                      <SelectItem value="BLOCK">Block calculation/finalization</SelectItem>
                      <SelectItem value="ZERO">Return zero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default result direction</Label>
                  <Select
                    value={defaultKpiResultDirection}
                    onValueChange={(value) =>
                      setDefaultKpiResultDirection(
                        value as
                          | "HIGHER_IS_BETTER"
                          | "LOWER_IS_BETTER"
                          | "TARGET_RANGE",
                      )
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGHER_IS_BETTER">Higher is better</SelectItem>
                      <SelectItem value="LOWER_IS_BETTER">Lower is better</SelectItem>
                      <SelectItem value="TARGET_RANGE">Target range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default outside-range scoring</Label>
                  <Select
                    value={defaultKpiTargetRangeOutsidePolicy}
                    onValueChange={(value) =>
                      setDefaultKpiTargetRangeOutsidePolicy(
                        value as KpiTargetRangeOutsidePolicy,
                      )
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZERO_OUTSIDE">
                        Zero outside range
                      </SelectItem>
                      <SelectItem value="NEAREST_BOUND_RATIO">
                        Nearest-bound ratio
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Inside the inclusive range always scores 100%. Nearest-bound
                    ratio uses actual ÷ minimum below and maximum ÷ actual above.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Weights Configuration */}
      {organizationId && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Performance Weights
            </h2>
          </div>
          <WeightConfigManager organizationId={organizationId} />
        </div>
      )}

      {/* Data Management Tools - Admin only */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <CardDescription>Tools for fixing and maintaining data integrity</CardDescription>
          </CardHeader>
          <CardContent>
            <FixAssigneeType />
          </CardContent>
        </Card>
      )}

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || !organizationId} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
