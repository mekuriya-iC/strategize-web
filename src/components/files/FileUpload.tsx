"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Loader2, FileIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useFileAttachmentMutations,
  validateFile,
  formatFileSize,
  getFileIcon,
} from "@/hooks/files/useFileAttachments";

interface FileUploadProps {
  relatedEntityType?: string;
  relatedEntityId?: string;
  organizationId: string;
  onUploadComplete?: () => void;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}

interface PendingFile {
  file: File;
  preview?: string;
  uploading: boolean;
  error?: string;
}

export default function FileUpload({
  relatedEntityType,
  relatedEntityId,
  organizationId,
  onUploadComplete,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  allowedTypes,
  multiple = true,
}: FileUploadProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createFileAttachment, loading } = useFileAttachmentMutations();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const newPendingFiles: PendingFile[] = [];

      fileArray.forEach((file) => {
        const validation = validateFile(file, { maxSizeBytes, allowedTypes });
        
        if (!validation.valid) {
          toast.error(`Invalid file: ${file.name}`, {
            description: validation.error,
          });
          return;
        }

        // Create preview for images
        let preview: string | undefined;
        if (file.type.startsWith("image/")) {
          preview = URL.createObjectURL(file);
        }

        newPendingFiles.push({
          file,
          preview,
          uploading: false,
        });
      });

      setPendingFiles((prev) => [...prev, ...newPendingFiles]);
    },
    [maxSizeBytes, allowedTypes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setPendingFiles((prev) => {
      const newFiles = [...prev];
      // Revoke preview URL if exists
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFile = async (file: File, index: number) => {
    // Update uploading status
    setPendingFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index].uploading = true;
      return newFiles;
    });

    try {
      // In a real implementation, you would upload to S3 or similar
      // For now, we'll simulate with a mock storage URL
      const storageKey = `${organizationId}/${Date.now()}-${file.name}`;
      const storageUrl = `/api/files/${storageKey}`; // Mock URL

      await createFileAttachment({
        fileName: file.name,
        fileType: file.type,
        fileSizeBytes: file.size,
        storageUrl,
        storageKey,
        organizationId,
        isPublic,
        relatedEntityType,
        relatedEntityId,
      });

      // Remove from pending files
      removeFile(index);
      onUploadComplete?.();
    } catch (error) {
      // Update error status
      setPendingFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index].uploading = false;
        newFiles[index].error = "Upload failed";
        return newFiles;
      });
    }
  };

  const uploadAll = async () => {
    const uploads = pendingFiles.map((_, index) =>
      uploadFile(pendingFiles[index].file, index)
    );
    await Promise.all(uploads);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 dark:border-gray-700"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Upload Files
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={allowedTypes?.join(",")}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Max file size: {formatFileSize(maxSizeBytes)}
            {allowedTypes && ` • Allowed types: ${allowedTypes.join(", ")}`}
          </p>
        </div>
      </Card>

      {/* Pending Files */}
      {pendingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Files to Upload ({pendingFiles.length})
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(!!checked)}
                />
                <Label htmlFor="isPublic" className="text-sm cursor-pointer">
                  Make files public
                </Label>
              </div>
              <Button
                size="sm"
                onClick={uploadAll}
                disabled={loading.create || pendingFiles.some((f) => f.uploading)}
              >
                {loading.create && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload All
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {pendingFiles.map((pendingFile, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  {/* Preview or Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {pendingFile.preview ? (
                      <img
                        src={pendingFile.preview}
                        alt={pendingFile.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">
                        {getFileIcon(pendingFile.file.type)}
                      </span>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {pendingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(pendingFile.file.size)} • {pendingFile.file.type || "Unknown type"}
                    </p>
                    {pendingFile.error && (
                      <p className="text-xs text-red-500 mt-1">{pendingFile.error}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {pendingFile.uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
