"use client";

import { useState } from "react";
import {
  useFileAttachments,
  useFileAttachmentMutations,
  formatFileSize,
  getFileIcon,
  type FileAttachment,
} from "@/hooks/files/useFileAttachments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Download,
  MoreHorizontal,
  Trash2,
  Eye,
  ExternalLink,
  Loader2,
  FileIcon,
  Lock,
  Globe,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface FileListProps {
  relatedEntityType?: string;
  relatedEntityId?: string;
  onFileClick?: (file: FileAttachment) => void;
  showUploader?: boolean;
}

export default function FileList({
  relatedEntityType,
  relatedEntityId,
  onFileClick,
  showUploader = true,
}: FileListProps) {
  const { files, loading, refetch } = useFileAttachments({
    relatedEntityType,
    relatedEntityId,
    limit: 100,
  });

  const { removeFileAttachment, loading: mutLoading } = useFileAttachmentMutations();
  const [deleteFile, setDeleteFile] = useState<FileAttachment | null>(null);

  const handleDelete = async () => {
    if (!deleteFile) return;
    try {
      await removeFileAttachment(deleteFile.fileAttachmentId);
      setDeleteFile(null);
      refetch();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDownload = (file: FileAttachment) => {
    // Open in new tab for download
    window.open(file.storageUrl, "_blank");
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!files.length) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <FileIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No files attached
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {showUploader
            ? "Upload files using the form above"
            : "No files have been attached to this item yet"}
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {files.map((file) => (
          <Card
            key={file.fileAttachmentId}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* File Icon/Preview */}
              <div
                className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 cursor-pointer"
                onClick={() => onFileClick?.(file)}
              >
                {file.fileType?.startsWith("image/") ? (
                  <img
                    src={file.storageUrl}
                    alt={file.fileName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onFileClick?.(file)}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block text-left"
                    >
                      {file.fileName}
                    </button>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.fileSizeBytes)}</span>
                      <span>•</span>
                      <span>{file.fileType || "Unknown type"}</span>
                      {file.isPublic ? (
                        <>
                          <span>•</span>
                          <Globe className="h-3 w-3 inline" />
                          <span>Public</span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <Lock className="h-3 w-3 inline" />
                          <span>Private</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onFileClick?.(file)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(file)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open(file.storageUrl, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in New Tab
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteFile(file)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Uploader Info */}
                <div className="flex items-center gap-2 mt-2">
                  <UserAvatar
                    src={file.uploadedBy.picture}
                    alt={file.uploadedBy.fullName}
                    fallbackText={file.uploadedBy.fullName}
                    size="sm"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Uploaded by <strong>{file.uploadedBy.fullName}</strong> on{" "}
                    {formatDate(file.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteFile}
        onOpenChange={(open) => !open && setDeleteFile(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>&quot;{deleteFile?.fileName}&quot;</strong>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={mutLoading.remove}
            >
              {mutLoading.remove && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
