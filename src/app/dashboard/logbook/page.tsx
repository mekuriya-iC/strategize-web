"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_LOGBOOK_ENTRIES } from "@/lib/graphql/queries/logbook";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { LogbookTable } from "@/components/logbook/LogbookTable";
import { LogbookEntryDialog } from "@/components/logbook/LogbookEntryDialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchIcon, FilterIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

// Helper function to map backend entry to frontend format
const mapEntryToFrontend = (entry: any) => ({
  id: entry.logbookEntryId,
  activity: entry.activity,
  description: entry.description || "",
  outcome: entry.outcome || "",
  entryDate: entry.entryDate,
  attachmentUrl: entry.attachmentUrl || null,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
  employee: entry.employee,
});

export default function LogbookPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // Get current user
  const { data: userData } = useQuery(GET_ME);
  const currentUser = userData?.me;

  // Get logbook entries
  const { data, loading, refetch } = useQuery(GET_LOGBOOK_ENTRIES, {
    variables: {
      employeeUserId: currentUser?.employeeId,
      limit: 100,
      page: 1,
    },
    skip: !currentUser?.employeeId,
  });

  // Map entries to frontend format
  const entries = useMemo(() => {
    if (!data?.logbookEntries?.items) return [];
    return data.logbookEntries.items.map(mapEntryToFrontend);
  }, [data]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return entries;
    
    const query = searchQuery.toLowerCase();
    return entries.filter((item: any) =>
      item.activity.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.outcome?.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData.map((item: any) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    }
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setIsAddEntryOpen(true);
  };

  const hasEntries = entries.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Logbook
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your daily activities and outcomes
          </p>
        </div>
        {hasEntries && (
          <Button
            onClick={() => setIsAddEntryOpen(true)}
            className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Entry
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : !hasEntries ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Empty State */}
          <div className="mb-8">
            <svg
              width="300"
              height="300"
              viewBox="0 0 300 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-80"
            >
              <rect x="75" y="50" width="150" height="200" rx="10" fill="#E0E7FF" />
              <rect x="100" y="80" width="100" height="10" rx="5" fill="#5B5BF7" />
              <rect x="100" y="110" width="80" height="8" rx="4" fill="#BDBDBD" />
              <rect x="100" y="130" width="90" height="8" rx="4" fill="#BDBDBD" />
              <rect x="100" y="150" width="70" height="8" rx="4" fill="#BDBDBD" />
              <circle cx="150" cy="200" r="30" fill="#3838EC" opacity="0.2" />
              <path
                d="M140 200 L148 208 L162 192"
                stroke="#3838EC"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No logbook entries yet
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
            Start documenting your daily activities, achievements, and learnings
          </p>

          <Button
            onClick={() => setIsAddEntryOpen(true)}
            className="bg-[#3838EC] hover:bg-[#2d2dbd] text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Your First Entry
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Search and Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredData.length} {filteredData.length === 1 ? 'entry' : 'entries'} found
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <FilterIcon className="w-4 h-4" />
                  Filter
                </Button>
              </div>
            </div>
          </div>

          {/* Logbook Table */}
          <LogbookTable
            data={paginatedData}
            selectedItems={selectedItems}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectItem}
            onRefetch={refetch}
            onEditEntry={handleEditEntry}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing Page {currentPage} of {totalPages}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "bg-[#3838EC] hover:bg-[#2d2dbd]" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 5 && <span className="text-gray-500">...</span>}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Entry Dialog */}
      <LogbookEntryDialog
        open={isAddEntryOpen}
        onOpenChange={(open) => {
          setIsAddEntryOpen(open);
          if (!open) setEditingEntry(null);
        }}
        onSuccess={() => {
          refetch();
          setIsAddEntryOpen(false);
          setEditingEntry(null);
        }}
        editingEntry={editingEntry}
      />
    </div>
  );
}
