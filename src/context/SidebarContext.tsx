"use client";
import { createContext, useContext, useState } from "react";

type SidebarContextType = {
  open: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSidebar = () => setOpen(true);
  const closeSidebar = () => setOpen(false);
  const toggleSidebar = () => setOpen((v) => !v);

  return (
    <SidebarContext.Provider
      value={{ open, openSidebar, closeSidebar, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}
