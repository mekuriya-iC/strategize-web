'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, Filter, FileDown } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';

export default function TeamResults() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock team data - in real app, fetch from backend
  const teamMembers = [
    {
      employeeId: '1',
      fullName: 'Abebe Bikila',
      department: 'RAS',
      avatar: 'AB',
      scores: {
        leadership: 3.3,
        communication: 4.6,
        innovation: 3.9,
        accountability: 3.2,
        overall: 3.8,
      },
      status: 'Done',
      statusColor: 'bg-green-100 text-green-700',
    },
    {
      employeeId: '2',
      fullName: 'Hawi Desta',
      department: 'Learning Solutions',
      avatar: 'HD',
      scores: {
        leadership: 4.0,
        communication: 3.3,
        innovation: 4.6,
        accountability: 3.9,
        overall: 3.9,
      },
      status: 'Done',
      statusColor: 'bg-green-100 text-green-700',
    },
    {
      employeeId: '3',
      fullName: 'Kidist Gashaw',
      department: 'KSP',
      avatar: 'KG',
      scores: {
        leadership: 4.7,
        communication: 4.0,
        innovation: 3.3,
        accountability: 4.6,
        overall: 4.2,
      },
      status: 'Done',
      statusColor: 'bg-green-100 text-green-700',
    },
    {
      employeeId: '4',
      fullName: 'John Doe',
      department: 'Corporate',
      avatar: 'JD',
      scores: {
        leadership: 3.4,
        communication: 4.7,
        innovation: 4.0,
        accountability: 3.3,
        overall: 3.8,
      },
      status: 'Pending',
      statusColor: 'bg-amber-100 text-amber-700',
    },
    {
      employeeId: '5',
      fullName: 'Janet Doe',
      department: 'HR',
      avatar: 'JD',
      scores: {
        leadership: 4.1,
        communication: 3.4,
        innovation: 4.7,
        accountability: 4.0,
        overall: 4.0,
      },
      status: 'Pending',
      statusColor: 'bg-amber-100 text-amber-700',
    },
  ];

  const filteredMembers = teamMembers.filter((member) =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 font-semibold';
    if (score >= 4.0) return 'text-teal-600 font-semibold';
    if (score >= 3.5) return 'text-amber-600 font-semibold';
    return 'text-orange-600 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Direct reports · Q2 2025</h2>
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
                    Leadership
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Communication
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Innovation
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                    Accountability
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
                    <td colSpan={9} className="py-12 text-center text-gray-500">
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
                        <span className={getScoreColor(member.scores.leadership)}>
                          {member.scores.leadership}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={getScoreColor(member.scores.communication)}>
                          {member.scores.communication}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={getScoreColor(member.scores.innovation)}>
                          {member.scores.innovation}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={getScoreColor(member.scores.accountability)}>
                          {member.scores.accountability}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-lg ${getScoreColor(member.scores.overall)}`}>
                          {member.scores.overall}
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
              <p className="text-3xl font-bold text-indigo-600">3.94</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">3</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-amber-600">2</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-teal-600">60%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
