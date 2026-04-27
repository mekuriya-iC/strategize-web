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

interface DivisionPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const DivisionPagination: React.FC<DivisionPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Don't show anything if there are no items
  if (totalItems === 0) {
    return null;
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Show first few pages
        pages.push(1, 2, 3, 4);
        if (totalPages > 4) pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last few pages
        pages.push(1);
        if (totalPages > 4) pages.push("ellipsis");
        pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Show pages around current page
        pages.push(1);
        if (currentPage > 3) pages.push("ellipsis");
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        if (currentPage < totalPages - 2) pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const showNavigationControls = totalPages > 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
      {/* Results info */}
      <div className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
        <span>
          Showing {startItem}-{endItem} of {totalItems} divisions
          {totalPages > 1 && (
            <span className="ml-2">
              (Page {currentPage} of {totalPages})
            </span>
          )}
        </span>
      </div>

      {/* Pagination controls - only show if more than one page */}
      {showNavigationControls && (
        <div className="order-1 sm:order-2">
          <Pagination>
            <PaginationContent>
              {/* Previous button */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={`
                    ${
                      currentPage === 1 || loading
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-gray-100"
                    }
                    px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-l-md
                  `}
                />
              </PaginationItem>

              {/* Page numbers */}
              {pageNumbers.map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis className="px-3 py-2 text-sm text-gray-500" />
                  ) : (
                    <PaginationLink
                      onClick={() => onPageChange(page as number)}
                      isActive={currentPage === page}
                      className={`
                        px-3 py-2 text-sm font-medium border cursor-pointer transition-colors
                        ${
                          currentPage === page
                            ? "bg-blue-50 border-blue-500 text-blue-600 z-10"
                            : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }
                        ${loading ? "pointer-events-none opacity-50" : ""}
                      `}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              {/* Next button */}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }
                  className={`
                    ${
                      currentPage === totalPages || loading
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-gray-100"
                    }
                    px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-r-md
                  `}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default DivisionPagination;
