'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvaluationCycleMutations } from '@/hooks/evaluations/useEvaluationCycles';
import { EvaluationCycleStatus } from '@/types/evaluation';
import { toast } from 'sonner';

interface EditEvaluationCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: any;
}

export default function EditEvaluationCycleDialog({
  open,
  onOpenChange,
  cycle,
}: EditEvaluationCycleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<EvaluationCycleStatus>(EvaluationCycleStatus.UPCOMING);
  const [loading, setLoading] = useState(false);

  const { updateCycle } = useEvaluationCycleMutations();

  useEffect(() => {
    if (cycle) {
      setName(cycle.name || '');
      setDescription(cycle.description || '');
      setStartDate(cycle.startDate || '');
      setEndDate(cycle.endDate || '');
      setStatus(cycle.status || EvaluationCycleStatus.UPCOMING);
    }
  }, [cycle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      await updateCycle({
        evaluationCycleId: cycle.evaluationCycleId,
        name,
        description,
        startDate,
        endDate,
        status,
      });

      toast.success('Evaluation cycle updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update evaluation cycle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Evaluation Cycle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Cycle Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as EvaluationCycleStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EvaluationCycleStatus.UPCOMING}>Upcoming</SelectItem>
                <SelectItem value={EvaluationCycleStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={EvaluationCycleStatus.CLOSED}>Closed</SelectItem>
                <SelectItem value={EvaluationCycleStatus.ARCHIVED}>Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
