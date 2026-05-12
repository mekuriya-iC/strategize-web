"use client";

import { type FileAttachment, formatFileSize, getFileIcon } from "@/hooks/files/useFileAttachments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface FilePreviewDialogProps {
  file: FileAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FilePreviewDialog({
  file,
  open,
  onOpenChange,
}: FilePreviewDialogProps) {
  if (!file) return null;

  const isImage = file.fileType?.startsWith("image/");
  const isPDF = file.fileType?.includes("pdf");
  const isVideo = file.fileType?.startsWith("video/");
  const isAudio = file.fileType?.startsWith("audio/");
  const isText = file.fileType?.startsWith("text/");

  const canPreview = isImage || isPDF || isVideo || isAudio || isText;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleDownload = () => {
    window.open(file.storageUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl truncate">{file.fileName}</DialogTitle>
              <DialogDescription className="mt-1">
                {formatFileSize(file.fileSizeBytes)} • {file.fileType || "Unknown type"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.storageUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          {canPreview ? (
            <div className="w-full h-full flex items-center justify-center">
              {isImage && (
                <img
                  src={file.storageUrl}
                  alt={file.fileName}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}

              {isPDF && (
                <iframe
                  src={file.storageUrl}
                  className="w-full h-full min-h-[600px] rounded-lg"
                  title={file.fileName}
                />
              )}

              {isVideo && (
                <video
                  src={file.storageUrl}
                  controls
                  className="max-w-full max-h-full rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {isAudio && (
                <div className="w-full max-w-md">
                  <audio src={file.storageUrl} controls className="w-full">
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              )}

              {isText && (
                <iframe
                  src={file.storageUrl}
                  className="w-full h-full min-h-[600px] rounded-lg bg-white dark:bg-gray-800"
                  title={file.fileName}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
                <span className="text-5xl">{getFileIcon(file.fileType)}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Preview not available
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
                This file type cannot be previewed in the browser. Download the file to
                view it.
              </p>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download File
              </Button>
            </div>
          )}
        </div>

        {/* File Metadata */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={file.uploadedBy.picture}
              alt={file.uploadedBy.fullName}
              fallbackText={file.uploadedBy.fullName}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {file.uploadedBy.fullName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Uploaded on {formatDate(file.createdAt)}
              </p>
            </div>
          </div>

          {file.relatedEntityType && file.relatedEntityId && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Attached to:</span> {file.relatedEntityType}{" "}
              (ID: {file.relatedEntityId})
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Visibility:</span>{" "}
              {file.isPublic ? "Public" : "Private"}
            </div>
            <div>
              <span className="font-medium">Storage Key:</span> {file.storageKey}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
