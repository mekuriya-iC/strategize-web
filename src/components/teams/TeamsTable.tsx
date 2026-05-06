"use client";

import { useState } from "react";
import { getOrganizationId } from "@/lib/constants/organization";
import { type Team, useTeamMutations } from "@/hooks/teams/useTeams";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@apollo/client";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { MoreHorizontal, Pencil, Trash2, Eye, Users, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import { useAuthStore } from "@/stores";

interface TeamsTableProps {
  teams: Team[];
  loading: boolean;
}

export default function TeamsTable({ teams, loading }: TeamsTableProps) {
  const router = useRouter();
  const { createTeam, updateTeam, removeTeam, loading: mutLoading } = useTeamMutations();

  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    departmentId: "none",
    teamLeadUserId: "none",
  });

  // Fetch departments for dropdown
  const { data: deptsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 100 },
  });
  const departments = deptsData?.departments?.items || [];

  // Fetch employees for team lead dropdown
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: empsData } = useQuery(GET_EMPLOYEES, {
    variables: { 
      page: 1, 
      limit: 200,
      ...(isAdmin ? {} : { departmentId: user?.department?.departmentId })
    },
  });
  const employees = empsData?.employees?.items || [];

  const resetForm = () =>
    setForm({ name: "", description: "", departmentId: "none", teamLeadUserId: "none" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    try {
      await createTeam({
        ...form,
        organizationId: getOrganizationId(),
        departmentId: form.departmentId && form.departmentId !== "none" ? form.departmentId : undefined,
        teamLeadUserId: form.teamLeadUserId && form.teamLeadUserId !== "none" ? form.teamLeadUserId : undefined,
      });
      resetForm();
      setShowCreate(false);
    } catch {
      /* handled */
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeam || !form.name) return;
    try {
      await updateTeam({
        teamId: editTeam.teamId,
        name: form.name,
        description: form.description || undefined,
        departmentId: form.departmentId && form.departmentId !== "none" ? form.departmentId : undefined,
        teamLeadUserId: form.teamLeadUserId && form.teamLeadUserId !== "none" ? form.teamLeadUserId : undefined,
        organizationId: getOrganizationId(),
      });
      resetForm();
      setEditTeam(null);
    } catch {
      /* handled */
    }
  };

  const handleDelete = async () => {
    if (!deleteTeam) return;
    try {
      await removeTeam(deleteTeam.teamId);
      setDeleteTeam(null);
    } catch {
      /* handled */
    }
  };

  const openEdit = (team: Team) => {
    setForm({
      name: team.name,
      description: team.description || "",
      departmentId: team.department?.departmentId || "none",
      teamLeadUserId: team.teamLead?.employeeId || "none",
    });
    setEditTeam(team);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const TeamForm = ({
    onSubmit,
    submitLabel,
    isLoading,
    onCancel,
  }: {
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    isLoading: boolean;
    onCancel: () => void;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label>Team Name *</Label>
        <Input
          placeholder="e.g. Engineering Team, Sales Team"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Department</Label>
        <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select department (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Department</SelectItem>
            {departments.map((dept: any) => (
              <SelectItem key={dept.departmentId} value={dept.departmentId}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Team Lead</Label>
        <Select
          value={form.teamLeadUserId}
          onValueChange={(v) => setForm({ ...form, teamLeadUserId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select team lead (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Team Lead</SelectItem>
            {employees.map((emp: any) => (
              <SelectItem key={emp.employeeId} value={emp.employeeId}>
                {emp.fullName} {emp.title && `- ${emp.title}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Describe the team's purpose and responsibilities..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !form.name}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="animate-pulse p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Teams
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage teams and assign team leads
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Team
        </Button>
      </div>

      {!teams.length ? (
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No teams yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            Create your first team to organize employees and track performance.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create Team
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                <TableHead className="font-semibold">Team Name</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Team Lead</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow
                  key={team.teamId}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                  onClick={() => router.push(`/dashboard/teams/${team.teamId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {team.name}
                        </p>
                        {team.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.department ? (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {team.department.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {team.teamLead ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          user={{
                            fullName: team.teamLead.fullName,
                            picture: team.teamLead.picture,
                          }}
                          size="xs"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {team.teamLead.fullName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No lead assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        team.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {team.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(team.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/teams/${team.teamId}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(team);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTeam(team);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Team</DialogTitle>
            <DialogDescription>Add a new team to your organization.</DialogDescription>
          </DialogHeader>
          <TeamForm
            onSubmit={handleCreate}
            submitLabel="Create Team"
            isLoading={mutLoading.create}
            onCancel={() => {
              resetForm();
              setShowCreate(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog
        open={!!editTeam}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
            setEditTeam(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Team</DialogTitle>
            <DialogDescription>Update team details.</DialogDescription>
          </DialogHeader>
          <TeamForm
            onSubmit={handleEdit}
            submitLabel="Save Changes"
            isLoading={mutLoading.update}
            onCancel={() => {
              resetForm();
              setEditTeam(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <AlertDialog
        open={!!deleteTeam}
        onOpenChange={(open) => !open && setDeleteTeam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteTeam?.name}&quot;</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={mutLoading.remove}
            >
              {mutLoading.remove && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
