import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = "User",
  fallbackText,
  size = "md",
  className = "",
}) => {
  // Generate fallback text from name
  const getFallbackText = () => {
    if (fallbackText) return fallbackText;
    if (alt && alt !== "User") {
      // Extract initials from full name
      return alt
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  // Convert potential Google Cloud Storage URL to proxy URL
  const getImageSrc = () => {
    if (!src) return undefined;

    // If it's a Google Cloud Storage URL, convert to proxy
    if (
      src.includes("storage.googleapis.com") ||
      src.includes("storage.cloud.google.com")
    ) {
      const filename = src.split("/").pop();
      return `/api/storage/${filename}`;
    }

    return src;
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={getImageSrc()} alt={alt} className="object-cover" />
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
        {getFallbackText()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
