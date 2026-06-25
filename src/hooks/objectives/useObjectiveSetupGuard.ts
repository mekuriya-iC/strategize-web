"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";

/**
 * Guard hook for admins: redirects to /setup/objectives if the selected
 * strategic period has no objectives yet.
 *
 * Runs inside the dashboard layout so it fires on every dashboard entry.
 * Skips for non-admin users — they don't manage objectives at this level.
 */
export function useObjectiveSetupGuard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const selectedPeriod = useStrategicPeriodStore(
    (state) => state.selectedPeriod,
  );
  const hasRedirected = useRef(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Only query when we have an admin user and a selected period
  const { data, loading } = useQuery(GET_OBJECTIVES, {
    variables: {
      page: 1,
      limit: 1, // we only need to know if any exist
    },
    skip: !isAdmin || !selectedPeriod,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    // Wait until we have a user, a period, and the query has resolved
    if (!isAdmin || !selectedPeriod || loading || hasRedirected.current) return;

    const totalItems = data?.objectives?.meta?.totalItems ?? null;

    // null means query hasn't returned yet
    if (totalItems === null) return;

    if (totalItems === 0) {
      hasRedirected.current = true;
      router.push("/setup/objectives");
    }
  }, [isAdmin, selectedPeriod, loading, data, router]);
}
