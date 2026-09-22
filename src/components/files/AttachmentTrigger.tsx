"use client";

import { useState, type ReactNode } from "react";
import { FileIcon, Paperclip } from "lucide-react";
import AttachmentPreviewDialog, {
  type AttachmentPreviewItem,
} from "@/components/files/AttachmentPreviewDialog";
import {
  getAttachmentDisplayName,
  getAttachmentShortLabel,
  resolveAttachmentPreviewKind,
} from "@/utils/attachment-preview";
import { cn } from "@/lib/utils";

interface AttachmentTriggerProps {
  url: string;
  name?: string | null;
  mimeType?: string | null;
  evidenceType?: string | null;
  className?: string;
  children?: ReactNode;
  /** Compact chip used in tables */
  variant?: "chip" | "link" | "button";
}

export function AttachmentTrigger({
  url,
  name,
  mimeType,
  evidenceType,
  className,
  children,
  variant = "chip",
}: AttachmentTriggerProps) {
  const [open, setOpen] = useState(false);
  if (!url) return null;

  const kind = resolveAttachmentPreviewKind({ url, mimeType, evidenceType });
  const label =
    children ??
    (evidenceType?.toUpperCase() === "EMAIL"
      ? "Email note"
      : getAttachmentShortLabel(url, name, mimeType, evidenceType));

  const item: AttachmentPreviewItem = { url, name, mimeType, evidenceType };
  const fullName = getAttachmentDisplayName(url, name);

  const content =
    variant === "link" ? (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "break-all text-left text-sm text-[#3838EC] underline hover:text-[#2c2cc0]",
          className,
        )}
      >
        {label}
      </button>
    ) : (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex max-w-[9.5rem] items-center gap-1 rounded-md text-[#3838EC] transition-colors hover:bg-[#3838EC]/10 hover:text-[#2c2cc0]",
          variant === "chip" && "px-1.5 py-0.5 text-xs",
          variant === "button" &&
            "max-w-none border border-[#3838EC]/30 px-2.5 py-1.5 text-sm",
          className,
        )}
        title={`Preview ${fullName}`}
      >
        {kind === "image" ? (
          <Paperclip className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <FileIcon className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </button>
    );

  return (
    <>
      {content}
      <AttachmentPreviewDialog
        item={open ? item : null}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

interface AttachmentListProps {
  items: AttachmentPreviewItem[];
  className?: string;
  emptyLabel?: string;
}

export function AttachmentList({
  items,
  className,
  emptyLabel = "None",
}: AttachmentListProps) {
  const usable = items.filter((item) => Boolean(item.url));
  if (!usable.length) {
    return <span className="text-sm text-gray-400">{emptyLabel}</span>;
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {usable.map((item, index) => (
        <AttachmentTrigger
          key={`${item.url}-${index}`}
          url={item.url}
          name={item.name}
          mimeType={item.mimeType}
          evidenceType={item.evidenceType}
        />
      ))}
    </div>
  );
}
