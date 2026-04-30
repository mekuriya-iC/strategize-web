'use client';

import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { useCompetencyIndicators } from '@/hooks/competencies/useCompetencies';

interface CompetencyIndicatorsListProps {
  competencyId: string;
  onEdit: (indicator: any) => void;
  onDelete: (indicatorId: string, description: string) => void;
}

export default function CompetencyIndicatorsList({
  competencyId,
  onEdit,
  onDelete,
}: CompetencyIndicatorsListProps) {
  const { indicators, loading } = useCompetencyIndicators(competencyId, 1, 100);

  if (loading) {
    return (
      <div className="pl-4 py-2">
        <p className="text-xs text-gray-500">Loading indicators...</p>
      </div>
    );
  }

  if (!indicators || indicators.length === 0) {
    return (
      <div className="pl-4 py-2">
        <p className="text-xs text-gray-500">No indicators yet</p>
      </div>
    );
  }

  return (
    <div className="pl-4 space-y-1.5">
      {indicators.map((indicator: any, index: number) => (
        <div key={indicator.competencyIndicatorId} className="flex items-start gap-2 text-sm">
          <span className="text-gray-500 mt-0.5">{index + 1}</span>
          <span className="text-gray-700 flex-1">{indicator.description}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEdit(indicator)}
            >
              <Edit2 className="h-3 w-3 text-gray-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onDelete(indicator.competencyIndicatorId, indicator.description)}
            >
              <Trash2 className="h-3 w-3 text-gray-400" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
