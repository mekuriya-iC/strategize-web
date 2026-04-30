'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetencyMutations, useCoreCompetencies } from '@/hooks/competencies/useCompetencies';
import { toast } from 'sonner';

interface CreateCompetencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coreCompetencyId?: string;
}

export default function CreateCompetencyDialog({
  open,
  onOpenChange,
  coreCompetencyId,
}: CreateCompetencyDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCoreCompetencyId, setSelectedCoreCompetencyId] = useState(coreCompetencyId || '');
  const [loading, setLoading] = useState(false);

  const { coreCompetencies } = useCoreCompetencies(1, 100);
  const { createCompetency } = useCompetencyMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !selectedCoreCompetencyId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      await createCompetency({
        name,
        description,
        coreCompetencyId: selectedCoreCompetencyId,
        isActive: true,
        organizationId: '1',
      });

      toast.success('Competency created successfully');
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create competency');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    if (!coreCompetencyId) {
      setSelectedCoreCompetencyId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Competency</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coreCompetency">
              Core Competency <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedCoreCompetencyId}
              onValueChange={setSelectedCoreCompetencyId}
              disabled={!!coreCompetencyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select core competency" />
              </SelectTrigger>
              <SelectContent>
                {coreCompetencies?.map((core: any) => (
                  <SelectItem key={core.coreCompetencyId} value={core.coreCompetencyId}>
                    {core.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Competency Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Strategic Thinking"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this competency"
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
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
