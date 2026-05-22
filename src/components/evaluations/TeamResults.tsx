'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, Filter, FileDown, Search } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { usePermissions } from '@/hooks/permissions/usePermissions';
import { useDirectReports, useEmployees } from '@/hooks/employees/useEmployees';
import { useAggregatePerformanceResults } from '@/hooks/performance/usePerformance';
import { useEvaluationCycles } from '@/hooks/evaluations/useEvaluationCycles';
import { EvaluationCycleStatus } from '@/types/evaluation';

export default function TeamResults() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  
  const canReadAll = can('evaluations:read_all');
  
  // Fetch either all employees (HR/Admin) or direct reports (Manager)
  const { employees: allEmployees, loading: employeesLoading } = useEmployees(1, 1000, '');
  const { directReports, loading: reportsLoading } = useDirectReports();
  
  const { cycles } = useEvaluationCycles(1, 1, '', EvaluationCycleStatus.ACTIVE);
  const activeCycle = cycles?.[0];
  
  const { results: performanceResults, loading: performanceLoading } = useAggregatePerformanceResults({
    page: 1,
    limit: 1000,
    strategicPeriodId: activeCycle?.strategicPeriod?.strategicPeriodId,
  });

  // Determine which list of employees to show based on permissions
  const targetEmployees = useMemo(() => {
    if (canReadAll) return allEmployees;
    return directReports;
  }, [canReadAll, allEmployees, directReports]);

  // Match target employees with their performance results
  const teamMembers = targetEmployees.map((employee: any) => {
    const performance = performanceResults.find(
      (r: any) => r.user.employeeId === employee.employeeId
    );
    
    const initials = employee.fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
    
    return {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      department: employee.departments?.[0]?.name || 'N/A',
      avatar: initials,
      scores: {
        competency: performance?.competencyScore || 0,
        individualKpi: performance?.individualKpiScore || 0,
        sharedKpi: performance?.sharedKpiScore || 0,
        overall: performance?.aggregateScore || 0,
      },
      status: performance ? 'Done' : 'Pending',
    };
  });

  const filteredMembers = teamMembers.filter((member: any) =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate team statistics
  const completedMembers = teamMembers.filter((m: any) => m.status === 'Done');
  const completedCount = completedMembers.length;
  const pendingCount = teamMembers.length - completedCount;
  const teamAverage = completedMembers.length > 0
    ? (completedMembers.reduce((sum: number, m: any) => sum + m.scores.overall, 0) / completedMembers.length).toFixed(2)
    : '0.00';
  const completionRate = teamMembers.length > 0
    ? Math.round((completedCount / teamMembers.length) * 100)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 font-semibold';
    if (score >= 4.0) return 'text-teal-600 font-semibold';
    if (score >= 3.5) return 'text-amber-600 font-semibold';
    if (score > 0) return 'text-orange-600 font-semibold';
    return 'text-gray-400';
  };

  const loading = reportsLoading || performanceLoading || employeesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading team results...</p>
        </div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-white rounded-2xl">
        <CardContent className="py-20 text-center">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No employees found</p>
          <p className="text-sm text-gray-400 mt-2 font-medium">
            {canReadAll ? "No employees found in the system." : "You don't have any team members reporting to you."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Team</p>
              <p className="text-3xl font-bold text-gray-900">{teamMembers.length}</p>
              <p className="text-[10px] text-gray-500 font-medium">Active members</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completion</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
                <p className="text-[10px] text-gray-500 font-bold">({completedCount}/{teamMembers.length})</p>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Evaluations finished</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Team Average</p>
              <p className="text-3xl font-bold text-indigo-600">{teamAverage}</p>
              <p className="text-[10px] text-gray-500 font-medium">Overall score avg</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending</p>
              <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">Requires action</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {canReadAll ? "Organization-wide Results" : "Team Performance"}
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
            {activeCycle?.name || 'Current Cycle'} · {filteredMembers.length} members shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-wider gap-2">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-wider gap-2">
            <FileDown className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-lg shadow-indigo-100">
            <Bell className="h-3.5 w-3.5" />
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Search and List */}
      <div className="space-y-4">
        <div className="max-w-md relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-indigo-600 transition-colors" />
          <Input
            type="text"
            placeholder="Search by name or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 h-11 bg-white border-none shadow-sm rounded-xl text-sm focus-visible:ring-indigo-600"
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Employee
                    </th>
                    <th className="text-left py-4 px-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Department
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Comp.
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Indiv. KPI
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Shared KPI
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Overall
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Status
                    </th>
                    <th className="text-right py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                        No team members found
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member: any) => (
                      <tr key={member.employeeId} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
                              {member.avatar}
                            </div>
                            <span className="font-bold text-gray-900 text-sm">
                              {member.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
                            {member.department}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-sm ${getScoreColor(member.scores.competency)}`}>
                            {member.scores.competency.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-sm ${getScoreColor(member.scores.individualKpi)}`}>
                            {member.scores.individualKpi.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-sm ${getScoreColor(member.scores.sharedKpi)}`}>
                            {member.scores.sharedKpi.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-sm font-bold ${getScoreColor(member.scores.overall)}`}>
                              {member.scores.overall.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge className={`text-[10px] font-bold uppercase tracking-widest border-none px-2 py-0.5 h-5 ${
                            member.status === 'Done' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {member.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
