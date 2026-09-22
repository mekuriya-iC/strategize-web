"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared responsive data-table layout helpers.
 *
 * Pattern (CheckIn / Logbook):
 * - Desktop (lg+): full table
 * - Mobile/tablet: stacked cards / list
 *
 * For wide metric tables where cards don't fit, prefer
 * `<Table stickyFirstColumn>` horizontal scroll instead.
 */

/** Desktop-only table shell (hidden below lg). */
function DataTableDesktop({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-desktop"
      className={cn("hidden overflow-hidden lg:block", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** Mobile/tablet card list (hidden at lg+). */
function DataTableCards({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-cards"
      className={cn("space-y-3 lg:hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Lightweight card row for mobile fallbacks.
 * Use for simple entity lists (employees, KPIs, etc.).
 */
function DataTableCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-card"
      className={cn(
        "rounded-lg border border-border bg-background p-4 shadow-xs",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DataTableCardHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-card-header"
      className={cn("flex items-start justify-between gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function DataTableCardMeta({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-card-meta"
      className={cn(
        "mt-3 grid gap-2 border-t border-border pt-3 text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DataTableCardMetaRow({
  label,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & { label: string }) {
  return (
    <div
      data-slot="data-table-card-meta-row"
      className={cn("flex items-start justify-between gap-3", className)}
      {...props}
    >
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-foreground">{children}</span>
    </div>
  );
}

function DataTableCardActions({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-card-actions"
      className={cn(
        "mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3",
        "[&_button]:min-h-9 [&_button]:touch-manipulation",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Optional stacked-row API (unused historically; kept for simple lists)      */
/* -------------------------------------------------------------------------- */

const ResponsiveTable = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props} />
));
ResponsiveTable.displayName = "ResponsiveTable";

const ResponsiveTableHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("hidden md:block", className)} {...props}>
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
    className={cn("space-y-3 md:space-y-0 md:block", className)}
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
      "md:flex md:items-center md:border-b md:border-border md:bg-transparent md:p-0",
      "rounded-lg border border-border bg-background p-4",
      !isHeader && "md:hover:bg-muted/50",
      className,
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
      "flex-1 px-4 py-3 text-left text-sm font-semibold text-muted-foreground",
      className,
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
      "flex items-center justify-between py-2 text-sm md:flex-1 md:px-4 md:py-3 md:text-sm",
      hideOnMobile && "hidden md:flex",
      className,
    )}
    {...props}
  >
    {label && (
      <span className="mr-2 font-medium text-muted-foreground md:hidden">
        {label}
      </span>
    )}
    <span className="flex-1 text-right text-foreground md:flex-none md:text-left">
      {children}
    </span>
  </div>
));
ResponsiveTableCell.displayName = "ResponsiveTableCell";

export {
  DataTableDesktop,
  DataTableCards,
  DataTableCard,
  DataTableCardHeader,
  DataTableCardMeta,
  DataTableCardMetaRow,
  DataTableCardActions,
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableHead,
  ResponsiveTableCell,
};
