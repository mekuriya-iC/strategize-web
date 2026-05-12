"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive Table Wrapper
 * 
 * On desktop: Shows as a normal table
 * On mobile: Shows as stacked cards
 * 
 * Usage:
 * <ResponsiveTable>
 *   <ResponsiveTableHeader>
 *     <ResponsiveTableRow>
 *       <ResponsiveTableHead>Name</ResponsiveTableHead>
 *       <ResponsiveTableHead>Email</ResponsiveTableHead>
 *     </ResponsiveTableRow>
 *   </ResponsiveTableHeader>
 *   <ResponsiveTableBody>
 *     <ResponsiveTableRow>
 *       <ResponsiveTableCell label="Name">John Doe</ResponsiveTableCell>
 *       <ResponsiveTableCell label="Email">john@example.com</ResponsiveTableCell>
 *     </ResponsiveTableRow>
 *   </ResponsiveTableBody>
 * </ResponsiveTable>
 */

const ResponsiveTable = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full", className)}
    {...props}
  />
));
ResponsiveTable.displayName = "ResponsiveTable";

const ResponsiveTableHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("hidden md:block", className)}
    {...props}
  >
    {children}
  </div>
));
ResponsiveTableHeader.displayName = "ResponsiveTableHeader";

const ResponsiveTableBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "md:block",
      // Mobile: Stack as cards
      "space-y-4 md:space-y-0",
      className
    )}
    {...props}
  />
));
ResponsiveTableBody.displayName = "ResponsiveTableBody";

const ResponsiveTableRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isHeader?: boolean;
  }
>(({ className, isHeader, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Desktop: Table row
      "md:flex md:items-center md:border-b md:border-gray-200 dark:md:border-gray-800",
      // Mobile: Card
      "md:bg-transparent bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 md:p-0",
      !isHeader && "md:hover:bg-gray-50 dark:md:hover:bg-gray-800/50",
      className
    )}
    {...props}
  />
));
ResponsiveTableRow.displayName = "ResponsiveTableRow";

const ResponsiveTableHead = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-1 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300",
      className
    )}
    {...props}
  />
));
ResponsiveTableHead.displayName = "ResponsiveTableHead";

const ResponsiveTableCell = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    label?: string;
    hideOnMobile?: boolean;
  }
>(({ className, label, hideOnMobile, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Desktop: Table cell
      "md:flex-1 md:px-4 md:py-3 md:text-sm",
      // Mobile: Stacked with label
      "flex justify-between items-center py-2 md:py-0 text-sm",
      hideOnMobile && "hidden md:flex",
      className
    )}
    {...props}
  >
    {label && (
      <span className="font-medium text-gray-600 dark:text-gray-400 md:hidden mr-2">
        {label}:
      </span>
    )}
    <span className="text-gray-900 dark:text-gray-100 md:text-left text-right flex-1 md:flex-none">
      {children}
    </span>
  </div>
));
ResponsiveTableCell.displayName = "ResponsiveTableCell";

export {
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableHead,
  ResponsiveTableCell,
};
