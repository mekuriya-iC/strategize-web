"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStrategicPlan, useStrategicPillars, useStrategicPlanMutations } from "@/hooks/strategicPlans/useStrategicPlans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Plus, Target, Trash2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StrategicPeriodsManager from "@/components/strategic-plans/StrategicPeriodsManager";

export default function StrategicPlanDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const { strategicPlan, loading } = useStrategicPlan(id);
  const { strategicPillars, loading: pillarsLoading } = useStrategicPillars(id);
  const { createStrategicPillar, removeStrategicPillar } = useStrategicPlanMutations();

  const [createPillarOpen, setCreatePillarOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const handleCreatePillar = async () => {
    try {
      await createStrategicPillar({ ...form, strategicPlanId: id });
      setCreatePillarOpen(false);
      setForm({ name: "", description: "" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePillar = async (pillarId: string) => {
    if (window.confirm("Are you sure you want to delete this strategic pillar?")) {
      await removeStrategicPillar(pillarId);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading plan details...</div>;
  }

  if (!strategicPlan) {
    return <div className="p-8 text-center text-red-500">Strategic plan not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {strategicPlan.title}
            </h1>
            <Badge variant="outline" className={strategicPlan.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
              {strategicPlan.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(strategicPlan.startDate).toLocaleDateString()} to {new Date(strategicPlan.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {strategicPlan.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{strategicPlan.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Pillars and Periods */}
      <Tabs defaultValue="pillars" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pillars" className="gap-2">
            <Target className="h-4 w-4" />
            Strategic Pillars
          </TabsTrigger>
          <TabsTrigger value="periods" className="gap-2">
            <Calendar className="h-4 w-4" />
            Strategic Periods
          </TabsTrigger>
        </TabsList>

        {/* Pillars Tab */}
        <TabsContent value="pillars" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Strategic Pillars</h2>
              <p className="text-sm text-gray-500">Core focus areas for this plan</p>
            </div>
            <Button onClick={() => setCreatePillarOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Pillar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pillarsLoading ? (
              <div className="col-span-3 text-center py-8 text-gray-500">Loading pillars...</div>
            ) : strategicPillars.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                No strategic pillars defined yet. Add one to get started.
              </div>
            ) : (
              strategicPillars.map((pillar) => (
                <Card key={pillar.strategicPillarId} className="relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{pillar.name}</CardTitle>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => handleDeletePillar(pillar.strategicPillarId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {pillar.description || "No description provided."}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Periods Tab */}
        <TabsContent value="periods">
          <StrategicPeriodsManager
            strategicPlanId={id}
            organizationId={strategicPlan.organization?.organizationId || "00000000-0000-0000-0000-000000000001"}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={createPillarOpen} onOpenChange={setCreatePillarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Strategic Pillar</DialogTitle>
            <DialogDescription>Create a new core focus area for this strategic plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pillar Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Digital Transformation" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button className="w-full mt-4" onClick={handleCreatePillar} disabled={!form.name}>
              Add Pillar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
