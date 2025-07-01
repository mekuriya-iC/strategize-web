import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ApolloWrapper } from "@/components/ApolloWrapper";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Strategize",
  description: "Strategize",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`  antialiased `}>
        <ApolloWrapper>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
