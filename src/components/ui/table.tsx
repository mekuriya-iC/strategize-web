"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Shared class for dense icon action buttons in tables (min ~36px touch target). */
export const tableIconButtonClassName =
  "h-9 w-9 min-h-9 min-w-9 shrink-0 touch-manipulation p-0"

/**
 * Apply to a raw HTML `<table>` when sticky first column is needed
 * (scorecards / reports that do not use the shadcn Table wrapper).
 */
export const stickyFirstColumnTableClassName = cn(
  "[&_th:first-child]:sticky [&_td:first-child]:sticky",
  "[&_th:first-child]:left-0 [&_td:first-child]:left-0",
  "[&_th:first-child]:z-[2] [&_td:first-child]:z-[1]",
  "[&_th:first-child]:bg-background [&_td:first-child]:bg-background",
  "[&_tr:hover>td:first-child]:bg-muted/50",
  "[&_th:first-child]:shadow-[1px_0_0_0_var(--border)]",
  "[&_td:first-child]:shadow-[1px_0_0_0_var(--border)]",
)

type TableProps = React.ComponentProps<"table"> & {
  containerClassName?: string
  /** Keep the first column visible while scrolling horizontally. */
  stickyFirstColumn?: boolean
}

function Table({
  className,
  containerClassName,
  stickyFirstColumn = false,
  ...props
}: TableProps) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]",
        containerClassName,
      )}
    >
      <table
        data-slot="table"
        data-sticky-first={stickyFirstColumn ? "true" : undefined}
        className={cn(
          "w-full caption-bottom text-sm",
          stickyFirstColumn && stickyFirstColumnTableClassName,
          stickyFirstColumn && "[&_th:first-child]:z-[4]",
          className,
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b",
        // Sticky within vertically scrollable table containers (cheap / no-op otherwise)
        "[&_th]:sticky [&_th]:top-0 [&_th]:z-[3] [&_th]:bg-background",
        className,
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-3 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  )
}

/** Action column cell with tappable min sizes for icon buttons. */
function TableActions({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-actions"
      className={cn(
        "p-2 align-middle whitespace-nowrap",
        "[&_button]:min-h-9 [&_button]:min-w-9 [&_button]:touch-manipulation",
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableActions,
  TableCaption,
}
