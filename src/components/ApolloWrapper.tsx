"use client";

import "@/lib/immer-setup";
import { useEffect, useState, type ReactNode } from "react";
import { ApolloProvider } from "@apollo/client";
import { CachePersistor, SessionStorageWrapper } from "apollo3-cache-persist";
import apolloClient from "@/lib/apollo-client";

const CACHE_KEY = "strategize-apollo-cache";

interface ApolloWrapperProps {
  children: ReactNode;
}

/**
 * Restores the Apollo cache from sessionStorage before mounting the tree so
 * dashboard lists (objectives, KPIs, etc.) reappear instantly on navigation
 * and soft refresh. Mutations that invalidate cache still fetch only what changed.
 * 
 * Cache is automatically cleared on logout via clearCacheOnLogout function.
 */
export function ApolloWrapper({ children }: ApolloWrapperProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let persistor: CachePersistor<object> | null = null;

    const restore = async () => {
      try {
        persistor = new CachePersistor({
          cache: apolloClient.cache,
          storage: new SessionStorageWrapper(window.sessionStorage),
          key: CACHE_KEY,
          debounce: 300, // Reduced from 500ms for faster persistence
          maxSize: 3_145_728, // Reduced to 3MB from 4.2MB to prevent storage quota issues
        });
        await persistor.restore();

        // Expose cache clearing function globally for logout
        if (typeof window !== "undefined") {
          (window as any).__clearApolloCache = async () => {
            try {
              await persistor?.purge();
              await apolloClient.clearStore();
              console.log("Apollo cache cleared successfully");
            } catch (error) {
              console.warn("Cache clear failed:", error);
            }
          };
        }
      } catch (error) {
        console.warn("Apollo cache restore skipped:", error);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#09090b]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
