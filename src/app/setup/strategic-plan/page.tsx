'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(currentYear, 0, 1), // January 1 of current year
    endDate: new Date(currentYear + 5, 11, 31), // December 31, five years from start
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Plan title is required');
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

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.startDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.endDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                      />
                    </PopoverContent>
                  </Popover>
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
