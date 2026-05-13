'use client';

import { useState, useEffect } from 'react';
import { getOrganizationId } from '@/lib/constants/organization';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCompetencyMutations } from '@/hooks/competencies/useCompetencies';
import { toast } from 'sonner';

interface EditCompetencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competency: any;
}

export default function EditCompetencyDialog({
  open,
  onOpenChange,
  competency,
}: EditCompetencyDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const organizationId = getOrganizationId();
  const { updateCompetency } = useCompetencyMutations(organizationId);

  useEffect(() => {
    if (competency) {
      setName(competency.name || '');
      setDescription(competency.description || '');
    }
  }, [competency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.error('Please enter a name');
      return;
    }

    setLoading(true);

    try {
      await updateCompetency({
        competencyId: competency.competencyId,
        name,
        description,
      });

      toast.success('Competency updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update competency');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Competency</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
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
