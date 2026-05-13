'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, Filter, FileDown } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useDirectReports } from '@/hooks/employees/useEmployees';
import { useAggregatePerformanceResults } from '@/hooks/performance/usePerformance';
import { useEvaluationCycles } from '@/hooks/evaluations/useEvaluationCycles';
import { EvaluationCycleStatus } from '@/types/evaluation';

export default function TeamResults() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { directReports, loading: reportsLoading } = useDirectReports();
  const { cycles } = useEvaluationCycles(1, 1, '', EvaluationCycleStatus.ACTIVE);
  const activeCycle = cycles?.[0];
  
  const { results: performanceResults, loading: performanceLoading } = useAggregatePerformanceResults({
    page: 1,
    limit: 100,
    strategicPeriodId: activeCycle?.strategicPeriod?.strategicPeriodId,
  });

  // Match direct reports with their performance results
  const teamMembers = directReports.map((employee: any) => {
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
      statusColor: performance ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
    };
  });

  const filteredMembers = teamMembers.filter((member) =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate team statistics
  const completedMembers = teamMembers.filter(m => m.status === 'Done');
  const completedCount = completedMembers.length;
  const pendingCount = teamMembers.length - completedCount;
  const teamAverage = completedMembers.length > 0
    ? (completedMembers.reduce((sum, m) => sum + m.scores.overall, 0) / completedMembers.length).toFixed(2)
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

  const loading = reportsLoading || performanceLoading;

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
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No direct reports found</p>
          <p className="text-sm text-gray-400 mt-2">
            You don't have any team members reporting to you
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Direct reports · {activeCycle?.name || 'Current Cycle'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredMembers.length} team member{filteredMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Bell className="h-4 w-4" />
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder="Search by name or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Team Members Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Dept
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Competency
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Individual KPI
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Shared KPI
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Overall
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No team members found
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.employeeId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium flex-shrink-0">
                            {member.avatar}
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap">
                            {member.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm whitespace-nowrap">
                        {member.department}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={getScoreColor(member.scores.competency)}>
                          {member.scores.competency > 0 ? member.scores.competency.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={getScoreColor(member.scores.individualKpi)}>
                          {member.scores.individualKpi > 0 ? member.scores.individualKpi.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={getScoreColor(member.scores.sharedKpi)}>
                          {member.scores.sharedKpi > 0 ? member.scores.sharedKpi.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-lg ${getScoreColor(member.scores.overall)}`}>
                          {member.scores.overall > 0 ? member.scores.overall.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={member.statusColor}>{member.status}</Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {member.status === 'Pending' && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Bell className="h-4 w-4 text-gray-400" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Team Average</p>
              <p className="text-3xl font-bold text-indigo-600">{teamAverage}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-teal-600">{completionRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
