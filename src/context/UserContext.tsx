"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/lib/graphql/queries/employees";
import { Employee } from "@/types/graphql";

interface UserContextType {
  user: Employee | null;
  loading: boolean;
  error: Error | undefined;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { data, loading, error } = useQuery(GET_ME);
  const user = data?.me || null;

  return (
    <UserContext.Provider value={{ user, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
