'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, GripVertical, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import Logo from '@/components/Logo';

const CREATE_STRATEGIC_PILLAR = gql`
  mutation CreateStrategicPillar($input: CreateStrategicPillarInput!) {
    createStrategicPillar(createStrategicPillarInput: $input) {
      strategicPillarId
      name
      description
    }
  }
`;

interface Pillar {
  id: string;
  name: string;
  description: string;
  color: string;
}

const BALANCED_SCORECARD_TEMPLATE = [
  { name: 'Financial', description: 'Financial performance and sustainability', color: '#10B981' },
  { name: 'Customer', description: 'Customer satisfaction and market position', color: '#3B82F6' },
  { name: 'Internal Process', description: 'Operational excellence and efficiency', color: '#F59E0B' },
  { name: 'Learning & Growth', description: 'Innovation, skills, and organizational development', color: '#8B5CF6' },
];

const PRESET_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', 
  '#EF4444', '#EC4899', '#14B8A6', '#F97316'
];

export default function StrategicPillarsSetupPage() {
  const router = useRouter();
  const [createPillar] = useMutation(CREATE_STRATEGIC_PILLAR);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [newPillar, setNewPillar] = useState({ name: '', description: '', color: PRESET_COLORS[0] });
  const [loading, setLoading] = useState(false);

  const strategicPlanId = typeof window !== 'undefined' ? sessionStorage.getItem('strategicPlanId') : null;

  useEffect(() => {
    if (!strategicPlanId) {
      toast.error('No strategic plan found. Please start from the beginning.');
      router.push('/organization-template');
    }
  }, [strategicPlanId, router]);

  const useBalancedScorecard = () => {
    const newPillars = BALANCED_SCORECARD_TEMPLATE.map((template, index) => ({
      id: `temp-${Date.now()}-${index}`,
      ...template,
    }));
    setPillars(newPillars);
    toast.success('Balanced Scorecard template applied');
  };

  const addPillar = () => {
    if (!newPillar.name) {
      toast.error('Pillar name is required');
      return;
    }

    const pillar: Pillar = {
      id: `temp-${Date.now()}`,
      name: newPillar.name,
      description: newPillar.description,
      color: newPillar.color,
    };

    setPillars([...pillars, pillar]);
    setNewPillar({ name: '', description: '', color: PRESET_COLORS[pillars.length % PRESET_COLORS.length] });
  };

  const removePillar = (id: string) => {
    setPillars(pillars.filter((p) => p.id !== id));
  };

  const handleContinue = async () => {
    if (pillars.length === 0) {
      toast.error('Please add at least one strategic pillar');
      return;
    }

    setLoading(true);
    try {
      console.log('🎯 Creating pillars:', pillars);
      console.log('📋 Strategic Plan ID:', strategicPlanId);
      
      // Create all pillars
      const createdPillars = [];
      for (let i = 0; i < pillars.length; i++) {
        console.log(`Creating pillar ${i + 1}/${pillars.length}:`, pillars[i]);
        
        const result = await createPillar({
          variables: {
            input: {
              strategicPlanId,
              name: pillars[i].name,
              description: pillars[i].description || undefined,
            },
          },
        });
        
        console.log(`✅ Pillar ${i + 1} created:`, result);
        createdPillars.push(result);
      }

      console.log('✅ All pillars created:', createdPillars);
      toast.success(`${pillars.length} strategic pillars created`);
      router.push('/setup/strategic-periods');
    } catch (error: any) {
      console.error('❌ Error creating pillars:', error);
      toast.error(error.message || 'Failed to create strategic pillars');
    } finally {
      setLoading(false);
    }
  };

  const progress = (3 / 4) * 100; // Step 3 of 4

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      <div className="w-full px-6 py-6">
        <Logo width={120} height={30} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl">Strategic Pillars</CardTitle>
              <span className="text-sm text-gray-500">Step 3 of 4</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-gray-600 mt-4">
              Strategic pillars are the key themes that organize your strategy. All objectives will be grouped under these.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Template Button */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <Button
                onClick={useBalancedScorecard}
                variant="outline"
                className="w-full border-indigo-300 hover:bg-indigo-100"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Use Balanced Scorecard Template
              </Button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Auto-creates: Financial, Customer, Internal Process, Learning & Growth
              </p>
            </div>

            {/* Add Pillar Form */}
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold">Add Pillar</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pillarName">Name *</Label>
                  <Input
                    id="pillarName"
                    placeholder="e.g., Customer Excellence"
                    value={newPillar.name}
                    onChange={(e) => setNewPillar({ ...newPillar, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="pillarDesc">Description (optional)</Label>
                  <Textarea
                    id="pillarDesc"
                    placeholder="Brief description of this pillar"
                    value={newPillar.description}
                    onChange={(e) => setNewPillar({ ...newPillar, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewPillar({ ...newPillar, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newPillar.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={addPillar} variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pillar
                </Button>
              </div>
            </div>

            {/* Pillars List */}
            {pillars.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Your Pillars ({pillars.length})</h3>
                {pillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                  >
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pillar.color }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{pillar.name}</p>
                      {pillar.description && (
                        <p className="text-sm text-gray-600">{pillar.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePillar(pillar.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleContinue}
              className="w-full"
              disabled={loading || pillars.length === 0}
            >
              {loading ? 'Creating Pillars...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
