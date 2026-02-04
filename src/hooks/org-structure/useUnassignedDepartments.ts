import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import type { PaginatedDepartments, Department } from "@/types/graphql";
import { appLogger } from "@/lib/logger";

export function useUnassignedDepartments() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data, loading, error, refetch } = useQuery<{ departments: PaginatedDepartments }>(
        GET_DEPARTMENTS,
        {
            variables: { page: 1, limit: 1000 },
            fetchPolicy: "cache-and-network",
            onError: (error) => {
                appLogger.error("Failed to load departments in unassigned filter:", error);
            },
        }
    );

    const departments = useMemo(() => data?.departments?.items || [], [data]);

    const unassignedDepartments = useMemo(() => {
        return departments.filter((dept: Department) => {
            // Check if department has no division assigned (null or undefined)
            // We check for division object existence or divisionId
            const isUnassigned = !dept.division || !dept.division.divisionId;

            // Filter by search term if provided
            const matchesSearch = dept.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

            return isUnassigned && matchesSearch;
        });
    }, [departments, searchTerm]);

    return {
        unassignedDepartments,
        loading,
        error,
        refetch,
        searchTerm,
        setSearchTerm,
    };
}
