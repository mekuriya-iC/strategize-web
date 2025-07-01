import React from "react";
import { Button } from "@/components/ui/button";

interface ObjectivePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const ObjectivePagination: React.FC<ObjectivePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is within limit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <Button
            key={i}
            variant="ghost"
            onClick={() => onPageChange(i)}
            className={
              i === currentPage
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }
            disabled={loading}
          >
            {i}
          </Button>
        );
      }
    } else {
      // Show ellipsis logic for many pages
      const showLeftEllipsis = currentPage > 3;
      const showRightEllipsis = currentPage < totalPages - 2;

      // Always show first page
      pages.push(
        <Button
          key={1}
          variant="ghost"
          onClick={() => onPageChange(1)}
          className={
            1 === currentPage
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-gray-600 hover:text-gray-900"
          }
          disabled={loading}
        >
          1
        </Button>
      );

      // Left ellipsis
      if (showLeftEllipsis) {
        pages.push(
          <span key="left-ellipsis" className="text-gray-400 px-2">
            ...
          </span>
        );
      }

      // Pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(
            <Button
              key={i}
              variant="ghost"
              onClick={() => onPageChange(i)}
              className={
                i === currentPage
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-600 hover:text-gray-900"
              }
              disabled={loading}
            >
              {i}
            </Button>
          );
        }
      }

      // Right ellipsis
      if (showRightEllipsis) {
        pages.push(
          <span key="right-ellipsis" className="text-gray-400 px-2">
            ...
          </span>
        );
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(
          <Button
            key={totalPages}
            variant="ghost"
            onClick={() => onPageChange(totalPages)}
            className={
              totalPages === currentPage
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }
            disabled={loading}
          >
            {totalPages}
          </Button>
        );
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        {totalItems > 0
          ? `Showing ${startItem}-${endItem} of ${totalItems} objectives`
          : "No objectives found"}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Previous
        </Button>
        {renderPageNumbers()}
        <Button
          variant="ghost"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="text-gray-600 hover:text-gray-900"
        >
          Next →
        </Button>
      </div>
    </div>
  );
};

export default ObjectivePagination;
