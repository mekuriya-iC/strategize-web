import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface EmployeeAvatarProps {
  src: string;
  alt: string;
  downloadUrl: string;
}

const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
  src,
  alt,
  downloadUrl,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-8">
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>{alt?.[0] || "?"}</AvatarFallback>
      </Avatar>
      <a
        href={downloadUrl}
        download
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <Download className="h-3 w-3" />
        Download
      </a>
    </div>
  );
};

export default EmployeeAvatar;
