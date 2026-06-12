'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { format, addYears, subDays } from 'date-fns';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuth } from '@/hooks/auth/useAuth';
import Logo from '@/components/Logo';

const CREATE_STRATEGIC_PLAN = gql`
  mutation CreateStrategicPlan($input: CreateStrategicPlanInput!) {
    createStrategicPlan(createStrategicPlanInput: $input) {
      strategicPlanId
      title
      description
      startDate
      endDate
    }
  }
`;

export default function StrategicPlanSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [createPlan, { loading }] = useMutation(CREATE_STRATEGIC_PLAN);

  const currentYear = new Date().getFullYear();
  const [planDurationYears, setPlanDurationYears] = useState<2 | 3 | 4 | 5 | null>(5);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(currentYear, 0, 1), // January 1 of current year
    endDate: subDays(addYears(new Date(currentYear, 0, 1), 5), 1),
  });

  const applyPlanDuration = (startDate: Date, years: number) => {
    return subDays(addYears(startDate, years), 1);
  };

  const handleDurationChange = (years: 2 | 3 | 4 | 5) => {
    setPlanDurationYears(years);
    setFormData((prev) => ({
      ...prev,
      endDate: applyPlanDuration(prev.startDate, years),
    }));
  };

  const handleStartDateChange = (date: Date) => {
    setFormData((prev) => {
      const newFormData = { ...prev, startDate: date };
      
      // Only auto-adjust end date if a duration is selected
      if (planDurationYears !== null) {
        newFormData.endDate = applyPlanDuration(date, planDurationYears);
      }
      
      return newFormData;
    });
  };

  const handleEndDateChange = (date: Date) => {
    // When user manually sets end date, clear the duration selection
    setPlanDurationYears(null);
    setFormData((prev) => ({
      ...prev,
      endDate: date,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Plan title is required');
      return;
    }

    if (formData.endDate <= formData.startDate) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      // Create strategic plan
      const result = await createPlan({
        variables: {
          input: {
            organizationId: user?.organizationId,
            title: formData.title,
            description: formData.description || undefined,
            startDate: formData.startDate.toISOString(),
            endDate: formData.endDate.toISOString(),
            isActive: true,
          },
        },
      });

      // Store plan ID for next steps
      sessionStorage.setItem('strategicPlanId', result.data.createStrategicPlan.strategicPlanId);
      sessionStorage.setItem('planStartDate', formData.startDate.toISOString());
      sessionStorage.setItem('planEndDate', formData.endDate.toISOString());

      toast.success('Strategic plan created successfully');
      router.push('/setup/strategic-pillars');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create strategic plan');
    }
  };

  const progress = (2 / 4) * 100; // Step 2 of 4

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      <div className="w-full px-6 py-6">
        <Logo width={120} height={30} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl">Your Strategic Plan</CardTitle>
              <span className="text-sm text-gray-500">Step 2 of 4</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-gray-600 mt-4">
              Every organization needs a strategic plan. This is your overarching roadmap.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Plan Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., 5-Year Growth Strategy 2026–2030"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe the purpose of this plan"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Plan duration */}
              <div className="space-y-2">
                <Label>Plan duration (optional)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {([2, 3, 4, 5] as const).map((years) => (
                    <Button
                      key={years}
                      type="button"
                      variant={planDurationYears === years ? 'default' : 'outline'}
                      onClick={() => handleDurationChange(years)}
                    >
                      {years} years
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Select a duration to auto-calculate end date, or set custom dates below.
                </p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={format(formData.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        handleStartDateChange(date);
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={format(formData.endDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        handleEndDateChange(date);
                      }
                    }}
                    min={format(formData.startDate, 'yyyy-MM-dd')}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Must be after start date. {planDurationYears === null && 'Custom duration selected.'}
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
