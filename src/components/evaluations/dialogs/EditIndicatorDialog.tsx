'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCompetencyMutations } from '@/hooks/competencies/useCompetencies';
import { toast } from 'sonner';

interface EditIndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicator: any;
}

export default function EditIndicatorDialog({
  open,
  onOpenChange,
  indicator,
}: EditIndicatorDialogProps) {
  const [description, setDescription] = useState('');
  const [ratingScaleMin, setRatingScaleMin] = useState(1);
  const [ratingScaleMax, setRatingScaleMax] = useState(5);
  const [loading, setLoading] = useState(false);

  const { updateIndicator } = useCompetencyMutations();

  useEffect(() => {
    if (indicator) {
      setDescription(indicator.description || '');
      setRatingScaleMin(indicator.ratingScaleMin || 1);
      setRatingScaleMax(indicator.ratingScaleMax || 5);
    }
  }, [indicator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description) {
      toast.error('Please enter a description');
      return;
    }

    if (ratingScaleMin >= ratingScaleMax) {
      toast.error('Maximum rating must be greater than minimum rating');
      return;
    }

    setLoading(true);

    try {
      await updateIndicator({
        competencyIndicatorId: indicator.competencyIndicatorId,
        description,
        ratingScaleMin,
        ratingScaleMax,
      });

      toast.success('Indicator updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update indicator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Indicator</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ratingScaleMin">Min Rating</Label>
              <Input
                id="ratingScaleMin"
                type="number"
                value={ratingScaleMin}
                onChange={(e) => setRatingScaleMin(parseInt(e.target.value))}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratingScaleMax">Max Rating</Label>
              <Input
                id="ratingScaleMax"
                type="number"
                value={ratingScaleMax}
                onChange={(e) => setRatingScaleMax(parseInt(e.target.value))}
                min="2"
              />
            </div>
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
