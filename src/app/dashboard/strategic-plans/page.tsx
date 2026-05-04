"use client";

import { useState } from "react";
import { useStrategicPlans, useStrategicPlanMutations } from "@/hooks/strategicPlans/useStrategicPlans";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Target, Search, Plus, Eye, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StrategicPlansPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [search, setSearch] = useState("");
  const { strategicPlans, meta, loading } = useStrategicPlans(page, limit, search);
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "", status: "DRAFT" });
  const { createStrategicPlan } = useStrategicPlanMutations();

  const handleCreate = async () => {
    try {
      await createStrategicPlan({ ...form, organizationId: "1" });
      setCreateOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Strategic Plans
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Manage organization-wide strategic plans and pillars
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search strategic plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900/50">
              <TableHead>Plan Name</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Loading strategic plans...
                </TableCell>
              </TableRow>
            ) : strategicPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  No strategic plans found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              strategicPlans.map((plan) => (
                <TableRow key={plan.strategicPlanId} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer" onClick={() => router.push(`/dashboard/strategic-plans/${plan.strategicPlanId}`)}>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{plan.name}</div>
                    {plan.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">{plan.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={plan.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}>
                      {plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/strategic-plans/${plan.strategicPlanId}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Strategic Plan</DialogTitle>
            <DialogDescription>Define a new high-level strategic period or plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Vision 2030" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleCreate} disabled={!form.name || !form.startDate || !form.endDate}>
              Create Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
