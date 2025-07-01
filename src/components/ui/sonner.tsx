"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";
import Image from "next/image";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        style: {
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "30px",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "500",
          color: "#374151",
          gap: "16px",
          display: "flex",
          alignItems: "center",
        },
        className: "toast",
        descriptionClassName: "text-gray-500 text-sm mt-1",
      }}
      icons={{
        success: (
          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
            <Image
              src="/images/toast-icon.png"
              alt="success"
              width={24}
              height={24}
            />
          </div>
        ),
        error: (
          <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full mr-3">
            <svg
              className="w-4 h-4 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        ),
      }}
      position="bottom-right"
      {...props}
    />
  );
};

export { Toaster };
