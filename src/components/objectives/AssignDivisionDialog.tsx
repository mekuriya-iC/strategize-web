import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Trash2 } from "lucide-react";

interface AssignDivisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignedDivisions: string[];
  onAssign: (division: string) => void;
  onRemove: (division: string) => void;
  allDivisions?: string[]; // Optional, fallback to mock
}

const mockDivisions = ["OD", "LS", "RAS", "HR", "IT", "Finance"];

export default function AssignDivisionDialog({
  open,
  onOpenChange,
  assignedDivisions,
  onAssign,
  onRemove,
  allDivisions = mockDivisions,
}: AssignDivisionDialogProps) {
  const [search, setSearch] = useState("");

  const filteredDivisions = allDivisions.filter((div) =>
    div.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl text-center font-semibold">
            Assign Division
          </DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>
        <div className="mb-6">
          <Input
            placeholder="Search divisions...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        {/* Assigned List */}
        <div className="mb-2 text-base font-semibold">Assigned</div>
        <div className="space-y-2 mb-6">
          {assignedDivisions.length === 0 && (
            <div className="text-muted-foreground text-sm">
              No divisions assigned.
            </div>
          )}
          {assignedDivisions.map((div) => (
            <div key={div} className="flex items-center gap-2">
              <span className="font-medium">{div}</span>
              <Badge className="bg-purple-100 text-purple-600 rounded-full px-3 py-1 text-xs font-semibold">
                Assigned
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(div)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        {/* Division List (filtered, not already assigned) */}
        {filteredDivisions.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            {filteredDivisions.map((div) => (
              <div
                key={div}
                className="flex items-center gap-2 py-2 border-b last:border-b-0"
              >
                <span className="font-medium flex-1">{div}</span>
                {assignedDivisions.includes(div) ? (
                  <Badge className="bg-purple-100 text-purple-600 rounded-full px-3 py-1 text-xs font-semibold">
                    Assigned
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4 py-1 text-xs font-semibold"
                    onClick={() => onAssign(div)}
                  >
                    Assign
                  </Button>
                )}
                {assignedDivisions.includes(div) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => onRemove(div)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
