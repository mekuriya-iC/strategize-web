"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useSystemConfigurationByOrg,
  useSystemConfigurationMutations,
} from "@/hooks/systemConfiguration/useSystemConfiguration";
import Logo from "@/components/Logo";
import { format, endOfMonth } from "date-fns";
import { getPreviewPeriodStatus } from "./periodPreview";
import type { PreviewPeriodStatus } from "./periodPreview";

const CREATE_STRATEGIC_PERIOD = gql`
  mutation CreateStrategicPeriod($input: CreateStrategicPeriodInput!) {
    createStrategicPeriod(createStrategicPeriodInput: $input) {
      strategicPeriodId
      name
      periodType
      startDate
      endDate
      status
    }
  }
`;

interface Period {
  name: string;
  type: "ANNUAL" | "QUARTERLY" | "MONTHLY";
  startDate: Date;
  endDate: Date;
  status: PreviewPeriodStatus;
}

export default function StrategicPeriodsSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { configuration, refetch: refetchConfiguration } =
    useSystemConfigurationByOrg(user?.organizationId ?? "");
  const { createConfiguration, updateConfiguration } =
    useSystemConfigurationMutations();
  const [createPeriod] = useMutation(CREATE_STRATEGIC_PERIOD);

  const [granularity, setGranularity] = useState<
    "annual" | "annual-quarterly" | "annual-quarterly-monthly" | "custom"
  >("annual-quarterly");
  const [fiscalType, setFiscalType] = useState<
    "ethiopian" | "calendar" | "custom"
  >("calendar");
  const [customStartMonth, setCustomStartMonth] = useState("1");
  const [loading, setLoading] = useState(false);

  const strategicPlanId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("strategicPlanId")
      : null;
  const planStartDate =
    typeof window !== "undefined"
      ? sessionStorage.getItem("planStartDate")
      : null;
  const planEndDate =
    typeof window !== "undefined"
      ? sessionStorage.getItem("planEndDate")
      : null;

  useEffect(() => {
    if (!strategicPlanId || !planStartDate || !planEndDate) {
      toast.error("Missing plan information. Please start from the beginning.");
      router.push("/organization-template");
    }
  }, [planEndDate, planStartDate, router, strategicPlanId]);

  const periods = useMemo<Period[]>(() => {
    if (!planStartDate || !planEndDate) return [];

    const start = new Date(planStartDate);
    const end = new Date(planEndDate);
    const generatedPeriods: Period[] = [];
    const today = new Date();

    // Adjust start date based on fiscal type
    let fiscalStart = new Date(start);
    if (fiscalType === "ethiopian") {
      // Ethiopian fiscal year: Hamle to Sene (July to June)
      fiscalStart = new Date(start.getFullYear(), 6, 1); // July 1
    } else if (fiscalType === "custom") {
      fiscalStart = new Date(
        start.getFullYear(),
        parseInt(customStartMonth) - 1,
        1,
      );
    }

    // Generate annual periods
    let currentYear = fiscalStart;
    while (currentYear <= end) {
      const yearEnd = new Date(currentYear);
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);
      yearEnd.setDate(yearEnd.getDate() - 1);

      if (yearEnd > end) {
        yearEnd.setTime(end.getTime());
      }

      const yearPeriod: Period = {
        name: `Year ${currentYear.getFullYear()}`,
        type: "ANNUAL",
        startDate: new Date(currentYear),
        endDate: new Date(yearEnd),
        status: getPreviewPeriodStatus(
          "ANNUAL",
          currentYear,
          yearEnd,
          today,
        ),
      };
      generatedPeriods.push(yearPeriod);

      // Generate quarterly periods if selected
      if (
        granularity === "annual-quarterly" ||
        granularity === "annual-quarterly-monthly"
      ) {
        for (let q = 0; q < 4; q++) {
          const qStart = new Date(currentYear);
          qStart.setMonth(qStart.getMonth() + q * 3);
          const qEnd = new Date(qStart);
          qEnd.setMonth(qEnd.getMonth() + 3);
          qEnd.setDate(qEnd.getDate() - 1);

          if (qStart > end) break;
          if (qEnd > end) qEnd.setTime(end.getTime());

          const quarterPeriod: Period = {
            name: `Q${q + 1} ${currentYear.getFullYear()}`,
            type: "QUARTERLY",
            startDate: new Date(qStart),
            endDate: new Date(qEnd),
            status: getPreviewPeriodStatus(
              "QUARTERLY",
              qStart,
              qEnd,
              today,
            ),
          };
          generatedPeriods.push(quarterPeriod);

          // Generate monthly periods if selected
          if (granularity === "annual-quarterly-monthly") {
            for (let m = 0; m < 3; m++) {
              const mStart = new Date(qStart);
              mStart.setMonth(mStart.getMonth() + m);
              const mEnd = endOfMonth(mStart);

              if (mStart > end) break;
              if (mEnd > end) mEnd.setTime(end.getTime());

              const monthPeriod: Period = {
                name: format(mStart, "MMMM yyyy"),
                type: "MONTHLY",
                startDate: new Date(mStart),
                endDate: new Date(mEnd),
                status: getPreviewPeriodStatus(
                  "MONTHLY",
                  mStart,
                  mEnd,
                  today,
                ),
              };
              generatedPeriods.push(monthPeriod);
            }
          }
        }
      }

      currentYear = new Date(yearEnd);
      currentYear.setDate(currentYear.getDate() + 1);
    }

    return generatedPeriods;
  }, [customStartMonth, fiscalType, granularity, planEndDate, planStartDate]);

  const handleComplete = async () => {
    if (periods.length === 0) {
      toast.error("No periods to create");
      return;
    }

    setLoading(true);
    try {
      // Create all periods
      for (const period of periods) {
        await createPeriod({
          variables: {
            input: {
              strategicPlanId,
              organizationId: user?.organizationId,
              name: period.name,
              periodType: period.type,
              startDate: format(period.startDate, "yyyy-MM-dd"),
              endDate: format(period.endDate, "yyyy-MM-dd"),
            },
          },
        });
      }

      const fiscalYearStartMonth =
        fiscalType === "ethiopian"
          ? 7
          : fiscalType === "custom"
            ? parseInt(customStartMonth, 10)
            : 1;

      if (user?.organizationId) {
        const latestConfigResult = await refetchConfiguration();
        const currentConfiguration =
          latestConfigResult.data?.systemConfigurationByOrg ?? configuration;

        if (currentConfiguration?.systemConfigurationId) {
          await updateConfiguration({
            systemConfigurationId: currentConfiguration.systemConfigurationId,
            fiscalYearStartMonth,
          });
        } else {
          await createConfiguration({
            organizationId: user.organizationId,
            fiscalYearStartMonth,
          });
        }
      }

      toast.success(`${periods.length} strategic periods created successfully`);

      // Clear session storage - onboarding complete
      sessionStorage.removeItem("strategicPlanId");
      sessionStorage.removeItem("planStartDate");
      sessionStorage.removeItem("planEndDate");
      sessionStorage.removeItem("selectedOrgTemplate");

      // Redirect to dashboard - objectives can be created from there
      router.push("/dashboard");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create strategic periods",
      );
    } finally {
      setLoading(false);
    }
  };

  const progress = (4 / 4) * 100; // Step 4 of 4

  const annualCount = periods.filter((p) => p.type === "ANNUAL").length;
  const quarterlyCount = periods.filter((p) => p.type === "QUARTERLY").length;
  const monthlyCount = periods.filter((p) => p.type === "MONTHLY").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      <div className="w-full px-6 py-6">
        <Logo width={120} height={30} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl">Strategic Periods</CardTitle>
              <span className="text-sm text-gray-500">Step 4 of 4</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-gray-600 mt-4">
              Break your plan into time periods for tracking and execution.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step A: Granularity */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                How would you like to divide your plan timeline?
              </Label>
              <RadioGroup
                value={granularity}
                onValueChange={(value) =>
                  setGranularity(
                    value as
                      | "annual"
                      | "annual-quarterly"
                      | "annual-quarterly-monthly"
                      | "custom",
                  )
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="annual" id="annual" />
                  <Label
                    htmlFor="annual"
                    className="font-normal cursor-pointer"
                  >
                    Annual only{" "}
                    <span className="text-gray-500">— One period per year</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="annual-quarterly"
                    id="annual-quarterly"
                  />
                  <Label
                    htmlFor="annual-quarterly"
                    className="font-normal cursor-pointer"
                  >
                    Annual + Quarterly{" "}
                    <span className="text-gray-500">
                      — Years divided into 4 quarters each
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="annual-quarterly-monthly"
                    id="annual-quarterly-monthly"
                  />
                  <Label
                    htmlFor="annual-quarterly-monthly"
                    className="font-normal cursor-pointer"
                  >
                    Annual + Quarterly + Monthly{" "}
                    <span className="text-gray-500">
                      — Quarters divided into months
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Step B: Fiscal Year */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Does your organization follow Ethiopian fiscal year?
              </Label>
              <RadioGroup
                value={fiscalType}
                onValueChange={(value) =>
                  setFiscalType(
                    value as "ethiopian" | "calendar" | "custom",
                  )
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ethiopian" id="ethiopian" />
                  <Label
                    htmlFor="ethiopian"
                    className="font-normal cursor-pointer"
                  >
                    Ethiopian fiscal year{" "}
                    <span className="text-gray-500">
                      — Hamle to Sene (July to June)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="calendar" id="calendar" />
                  <Label
                    htmlFor="calendar"
                    className="font-normal cursor-pointer"
                  >
                    Calendar year{" "}
                    <span className="text-gray-500">— January to December</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label
                    htmlFor="custom"
                    className="font-normal cursor-pointer"
                  >
                    Custom start month
                  </Label>
                </div>
              </RadioGroup>
              {fiscalType === "custom" && (
                <Select
                  value={customStartMonth}
                  onValueChange={setCustomStartMonth}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {format(new Date(2024, i, 1), "MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Step C: Preview */}
            <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Auto-generated Preview</h3>
                <div className="text-sm text-gray-600">
                  Total: {annualCount} annual + {quarterlyCount} quarterly +{" "}
                  {monthlyCount} monthly = {periods.length} periods
                </div>
              </div>
              <div className="space-y-1 text-sm font-mono">
                {periods.slice(0, 20).map((period, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span
                      className={
                        period.type === "ANNUAL"
                          ? "font-semibold"
                          : period.type === "QUARTERLY"
                            ? "ml-4"
                            : "ml-8"
                      }
                    >
                      {period.name}
                    </span>
                    <span className="text-gray-500">
                      ({format(period.startDate, "MMM d, yyyy")} –{" "}
                      {format(period.endDate, "MMM d, yyyy")})
                    </span>
                    {(period.status === "active" ||
                      period.status === "current") && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {period.status === "active" ? "Active" : "Current"}
                      </span>
                    )}
                  </div>
                ))}
                {periods.length > 20 && (
                  <div className="text-gray-500 ml-5">
                    ... and {periods.length - 20} more periods
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full"
              disabled={loading || periods.length === 0}
            >
              {loading ? "Creating Periods..." : "Complete Setup"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
