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

interface DataTablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange?: (rows: number) => void;
    loading?: boolean;
    itemName?: string;
}

const DataTablePagination: React.FC<DataTablePaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onRowsPerPageChange,
    loading = false,
    itemName = "items",
}) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const renderPageItems = () => {
        const items = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            onClick={(e) => {
                                e.preventDefault();
                                onPageChange(i);
                            }}
                            isActive={i === currentPage}
                            className="cursor-pointer"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            // Logic for ellipsis
            const showLeftEllipsis = currentPage > 3;
            const showRightEllipsis = currentPage < totalPages - 2;

            // First Page
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(1);
                        }}
                        isActive={currentPage === 1}
                        className="cursor-pointer"
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );

            if (showLeftEllipsis) {
                items.push(
                    <PaginationItem key="left-ellipsis">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            onClick={(e) => {
                                e.preventDefault();
                                onPageChange(i);
                            }}
                            isActive={i === currentPage}
                            className="cursor-pointer"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            if (showRightEllipsis) {
                items.push(
                    <PaginationItem key="right-ellipsis">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }

            // Last Page
            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(totalPages);
                        }}
                        isActive={currentPage === totalPages}
                        className="cursor-pointer"
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    if (totalPages <= 1 && totalItems <= itemsPerPage) {
        return (
            <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                    {totalItems > 0 ? `Showing all ${totalItems} ${itemName}` : `No ${itemName} found`}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
                {totalItems > 0
                    ? `Showing ${startItem}-${endItem} of ${totalItems} ${itemName}`
                    : `No ${itemName} found`}
            </div>

            <div className="flex items-center gap-4 order-1 sm:order-2">
                {onRowsPerPageChange && (
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium hidden sm:block">Rows per page</p>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => onRowsPerPageChange(parseInt(value, 10))}
                            disabled={loading}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={itemsPerPage} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <Pagination className="w-auto mx-0">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage > 1) onPageChange(currentPage - 1);
                                }}
                                aria-disabled={currentPage === 1 || loading}
                                className={currentPage === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>

                        {renderPageItems()}

                        <PaginationItem>
                            <PaginationNext
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage < totalPages) onPageChange(currentPage + 1);
                                }}
                                aria-disabled={currentPage === totalPages || loading}
                                className={currentPage === totalPages || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
};

export default DataTablePagination;
