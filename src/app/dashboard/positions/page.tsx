"use client";

import { useState } from "react";
import { usePositions } from "@/hooks/positions/usePositions";
import { PositionTable } from "@/components/positions";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function PositionsPage() {
  const [search, setSearch] = useState("");

  const { positions, loading } = usePositions({
    page: 1,
    limit: 100,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search positions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table (includes header and create button) */}
      <PositionTable positions={positions} loading={loading} />
    </div>
  );
}
