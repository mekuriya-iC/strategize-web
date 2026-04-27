"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_MY_LOGBOOK } from "@/lib/graphql/queries/logbook";
import { LogbookTable } from "@/components/logbook/LogbookTable";
import { Button } from "@/components/ui/button";
import { SearchIcon, FilterIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

// Mock data for preview
const MOCK_LOGBOOK_DATA = [
  {
    id: "log-1",
    kpiName: "Review a Gafat RFP ON Stress Management Training",
    target: 34,
    percentageCompletion: "89% of target",
    weight: 23,
    approvalStatus: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-2",
    kpiName: "Preparing Technical Proposal FOR Gafat ON Stress Management Training",
    target: 23,
    percentageCompletion: "32% of target",
    weight: 23,
    approvalStatus: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-3",
    kpiName: "Preparing financial Proposal FOR BG RFP ON Stress...",
    target: 11,
    percentageCompletion: "54% of target",
    weight: 23,
    approvalStatus: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-4",
    kpiName: "Refine LEAD Proposal LEAD (COORPORATE)",
    target: 85,
    percentageCompletion: "12% of target",
    weight: 23,
    approvalStatus: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-5",
    kpiName: "Finalize performance report logbook",
    target: 32,
    percentageCompletion: "0% of target",
    weight: 23,
    approvalStatus: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-6",
    kpiName: "Update the tracking sheet",
    target: 76,
    percentageCompletion: "99% of target",
    weight: 23,
    approvalStatus: "IN_REVIEW",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-7",
    kpiName: "Finalize performance report logbook",
    target: 87,
    percentageCompletion: "87% of target",
    weight: 23,
    approvalStatus: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-8",
    kpiName: "Update the tracking sheet",
    target: 54,
    percentageCompletion: "90% of target",
    weight: 23,
    approvalStatus: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-9",
    kpiName: "Finalize performance report logbook",
    target: 56,
    percentageCompletion: "68% of target",
    weight: 23,
    approvalStatus: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-10",
    kpiName: "Update the tracking sheet",
    target: 43,
    percentageCompletion: "75% of target",
    weight: 23,
    approvalStatus: "PENDING",
    createdAt: new Date().toISOString(),
  },
];

export default function LogbookPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [useMockData, setUseMockData] = useState(true); // Default to mock for preview
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { data, loading, refetch } = useQuery(GET_MY_LOGBOOK);

  // Get logbook data
  const logbookData = useMemo(() => {
    if (useMockData) {
      return MOCK_LOGBOOK_DATA;
    }
    return data?.myLogbook || [];
  }, [data, useMockData]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return logbookData;
    
    const query = searchQuery.toLowerCase();
    return logbookData.filter((item: any) =>
      item.kpiName.toLowerCase().includes(query)
    );
  }, [logbookData, searchQuery]);

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Logbook
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Search and Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1" />
              
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
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
          />

          {/* Pagination */}
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
                
                {[...Array(Math.min(3, totalPages))].map((_, i) => {
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
                
                {totalPages > 3 && <span className="text-gray-500">...</span>}
                
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
        </div>
      )}
    </div>
  );
}
