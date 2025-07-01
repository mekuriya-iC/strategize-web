"use client";

import { ApolloProvider } from "@apollo/client";
import apolloClient from "@/lib/apollo-client";

interface ApolloWrapperProps {
  children: React.ReactNode;
}

export function ApolloWrapper({ children }: ApolloWrapperProps) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
