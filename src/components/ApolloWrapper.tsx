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
 */
export function ApolloWrapper({ children }: ApolloWrapperProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const persistor = new CachePersistor({
          cache: apolloClient.cache,
          storage: new SessionStorageWrapper(window.sessionStorage),
          key: CACHE_KEY,
          debounce: 500,
          maxSize: 4_485_760, // ~4.2MB — stay under typical sessionStorage limits
        });
        await persistor.restore();
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
