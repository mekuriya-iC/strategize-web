"use client";
import Logo from "@/components/Logo";
import AddNewStrategyForm from "@/components/strategy-period/AddNewStrategyForm";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { useAuthStore } from "@/stores";
import { useEffect } from "react";

export default function AddNewStrategyPage() {
  const { data, loading } = useQuery(GET_ME);
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(loading);
    if (data?.me) setUser(data.me);
  }, [data, loading, setUser, setLoading]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] p-4 flex flex-col">
      {/* Logo at the top left */}
      <div className="w-full flex items-center mb-2">
        <Logo />
      </div>
      {/* Centered form section */}
      <div className="flex flex-col items-center justify-center flex-1">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">
          Add Strategic Period
        </h1>
        <p className="text-sm text-gray-500 text-center mb-10">
          Define a new period under your active strategic plan.
        </p>
        <AddNewStrategyForm />
      </div>
    </div>
  );
}
