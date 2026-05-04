"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText } from "lucide-react";
import FileUpload from "./FileUpload";
import FileList from "./FileList";
import FilePreviewDialog from "./FilePreviewDialog";
import { type FileAttachment } from "@/hooks/files/useFileAttachments";

interface FileManagerProps {
  relatedEntityType?: string;
  relatedEntityId?: string;
  organizationId: string;
  title?: string;
  description?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export default function FileManager({
  relatedEntityType,
  relatedEntityId,
  organizationId,
  title = "File Attachments",
  description = "Upload and manage files attached to this item",
  maxSizeBytes,
  allowedTypes,
}: FileManagerProps) {
  const [activeTab, setActiveTab] = useState("files");
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab("files");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files" className="gap-2">
                <FileText className="h-4 w-4" />
                Files
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="mt-6">
              <FileList
                key={refreshKey}
                relatedEntityType={relatedEntityType}
                relatedEntityId={relatedEntityId}
                onFileClick={setPreviewFile}
                showUploader={true}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-6">
              <FileUpload
                relatedEntityType={relatedEntityType}
                relatedEntityId={relatedEntityId}
                organizationId={organizationId}
                onUploadComplete={handleUploadComplete}
                maxSizeBytes={maxSizeBytes}
                allowedTypes={allowedTypes}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <FilePreviewDialog
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </>
  );
}
