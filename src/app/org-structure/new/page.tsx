"use client";
import Logo from "@/components/Logo";
import AddOrgStructureForm from "@/components/org-structure/AddOrgStructureForm";
import { useAuthStore } from "@/stores";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { useEffect } from "react";

export default function AddOrgStructurePage() {
  // Fetch user data and sync to store
  const { data, loading } = useQuery(GET_ME);
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(loading);
    if (data?.me) {
      setUser(data.me);
    }
  }, [data, loading, setUser, setLoading]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090b] flex flex-col">
      {/* Header with Logo */}
      <div className="w-full px-6 py-6 md:px-12 md:py-8">
        <Logo width={120} height={30} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 md:py-16">
        <div className="w-full max-w-xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-center mb-12 md:mb-16 text-[#11181C] dark:text-gray-100">
            Add New Org Structure
          </h1>
          
          <AddOrgStructureForm />
        </div>
      </div>
    </div>
  );
}
