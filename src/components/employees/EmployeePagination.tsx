import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmployeePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  loading?: boolean;
}

export default function EmployeePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  loading = false,
}: EmployeePaginationProps) {
  // Calculate visible page numbers
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const rangeWithDots = [];

    // Handle small number of pages (show all)
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        rangeWithDots.push(i);
      }
      return rangeWithDots;
    }

    // Calculate start and end of middle range
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    // Always include first page
    rangeWithDots.push(1);

    // Add ellipsis after first page if needed
    if (start > 2) {
      rangeWithDots.push("ellipsis1");
    }

    // Add middle range
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        rangeWithDots.push(i);
      }
    }

    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      rangeWithDots.push("ellipsis2");
    }

    // Always include last page (if more than 1 page)
    if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Calculate item range for display
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages && !loading) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1 && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6">
      {/* Items info and per page selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 md:justify-start ">
        <div className="text-sm text-muted-foreground">
          {loading
            ? "Loading..."
            : `Showing ${startItem}-${endItem} of ${totalItems} employees`}
        </div>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Show:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">per page</span>
          </div>
        )}
      </div>

      {/* Pagination - only show if there are multiple pages */}
      {totalPages >= 1 && (
        <Pagination className="md:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePrevious}
                className={
                  currentPage <= 1 || loading
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {getVisiblePages().map((page) => (
              <PaginationItem
                key={typeof page === "string" ? page : `page-${page}`}
              >
                {typeof page === "string" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => handlePageClick(page)}
                    isActive={page === currentPage}
                    className={
                      loading
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={handleNext}
                className={
                  currentPage >= totalPages || loading
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
