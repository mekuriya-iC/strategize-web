"use client";

import { useState } from "react";
import { useStrategicPlans, useStrategicPlanMutations } from "@/hooks/strategicPlans/useStrategicPlans";
import { useAuthStore } from "@/stores";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Target, Search, Plus, Eye, MoreVertical, Edit, Trash, Power, PowerOff, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getOrganizationId } from "@/lib/constants/organization";
import { toast } from "sonner";

export default function StrategicPlansPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [search, setSearch] = useState("");
  const { strategicPlans, meta, loading } = useStrategicPlans(page, limit, search);
  const { 
    createStrategicPlan, 
    removeStrategicPlan, 
    activateStrategicPlan, 
    deactivateStrategicPlan 
  } = useStrategicPlanMutations();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startDate: "", endDate: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const activePlan = strategicPlans.find(plan => plan.isActive);
  const hasActivePlan = !!activePlan;

  const handleCreate = async () => {
    if (hasActivePlan) {
      toast.error("Cannot create a new strategic plan while an active plan exists. Please deactivate the current plan first.");
      return;
    }

    try {
      await createStrategicPlan({ 
        ...form, 
        organizationId: getOrganizationId(),
        isActive: true // New plan becomes active automatically
      });
      setCreateOpen(false);
      setForm({ title: "", description: "", startDate: "", endDate: "" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivate = async (strategicPlanId: string) => {
    if (hasActivePlan && activePlan.strategicPlanId !== strategicPlanId) {
      toast.error("Another strategic plan is already active. Please deactivate it first.");
      return;
    }
    try {
      await activateStrategicPlan(strategicPlanId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeactivate = async (strategicPlanId: string) => {
    try {
      await deactivateStrategicPlan(strategicPlanId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      await removeStrategicPlan(planToDelete);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const openDeleteDialog = (strategicPlanId: string) => {
    setPlanToDelete(strategicPlanId);
    setDeleteDialogOpen(true);
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
        <Button 
          onClick={() => setCreateOpen(true)} 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          disabled={hasActivePlan}
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </div>

      {hasActivePlan && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{activePlan.title}</strong> is currently the active strategic plan. 
            {isSuperAdmin && " You can deactivate it to create a new plan."}
          </AlertDescription>
        </Alert>
      )}

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
                    <div className="font-medium text-gray-900 dark:text-gray-100">{plan.title}</div>
                    {plan.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">{plan.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={plan.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
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
                        {isSuperAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            {plan.isActive ? (
                              <DropdownMenuItem onClick={() => handleDeactivate(plan.strategicPlanId)}>
                                <PowerOff className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleActivate(plan.strategicPlanId)}
                                disabled={hasActivePlan}
                              >
                                <Power className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/strategic-plans/${plan.strategicPlanId}/edit`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(plan.strategicPlanId)}
                              className="text-red-600"
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Strategic Plan</DialogTitle>
            <DialogDescription>
              Define a new high-level strategic period or plan. This will become the active plan.
            </DialogDescription>
          </DialogHeader>
          {hasActivePlan && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                An active strategic plan already exists. Please deactivate it before creating a new one.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Vision 2030" />
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
            <Button 
              className="w-full mt-4" 
              onClick={handleCreate} 
              disabled={!form.title || !form.startDate || !form.endDate || hasActivePlan}
            >
              Create Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the strategic plan
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
