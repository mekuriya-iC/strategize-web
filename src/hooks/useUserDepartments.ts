import { useUser } from "@/context/UserContext";
import { Department } from "@/types/graphql";

/**
 * Custom hook to access the current user's department information
 * Uses the departments field from the Me query
 */
export const useUserDepartments = () => {
  const { user } = useUser();

  const departments: Department[] = user?.departments || [];
  const primaryDepartment = departments[0]; // Most employees belong to one department
  const departmentNames = departments.map((dept) => dept.name);

  return {
    departments,
    primaryDepartment,
    departmentNames,
    hasDepartments: departments.length > 0,
    isMultipleDepartments: departments.length > 1,
  };
};
