import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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
        className="text-xs text-primary underline hover:text-primary/80"
      >
        Download
      </a>
    </div>
  );
};

export default EmployeeAvatar;
