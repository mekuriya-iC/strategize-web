"use client";
import Logo from "@/components/Logo";
import StrategyPeriodGrid from "@/components/strategy-period/StrategyPeriodGrid";
import NewStrategyButton from "@/components/strategy-period/NewStrategyButton";
import { useAuthStore } from "@/stores";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/lib/graphql/queries/employees";
import { useEffect } from "react";

export default function StrategyPeriodPage() {
  // Fetch user data and sync to store
  const { data, loading } = useQuery(GET_ME);
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(loading);
    if (data?.me) {
      setUser(data.me);
    }
  }, [data, loading, setUser, setLoading]);

  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] p-4 flex flex-col items-center">
      <div className="w-full flex items-center mb-24">
        <Logo />
      </div>
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#11181C] dark:text-gray-100">
          Choose Strategy Period
        </h1>
        <StrategyPeriodGrid />
        {isAdmin && (
          <div className="flex justify-center mt-24">
            <NewStrategyButton />
          </div>
        )}
      </div>
    </div>
  );
}
