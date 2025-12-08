/**
 * UI Store
 * Manages UI state like sidebar, modals, and global UI preferences
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Actions - Sidebar
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;

  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Actions - Initialize
  initializeSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      globalLoading: false,
      loadingMessage: null,

      // Sidebar actions
      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      collapseSidebar: () => set({ sidebarCollapsed: true }),
      expandSidebar: () => set({ sidebarCollapsed: false }),

      // Loading actions
      setGlobalLoading: (loading, message) =>
        set({
          globalLoading: loading,
          loadingMessage: loading ? (message || null) : null,
        }),

      // Initialize sidebar based on screen size
      initializeSidebar: () => {
        if (typeof window !== "undefined") {
          const isMobile = window.innerWidth < 768;
          set({ sidebarOpen: !isMobile });
        }
      },
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Selector hooks
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading);


