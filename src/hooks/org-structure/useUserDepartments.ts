import { useAuthStore } from "@/stores";

// Simplified department type that matches what's returned from user query
interface UserDepartment {
  departmentId: string;
  name: string;
}

/**
 * Custom hook to access the current user's department information
 * Uses the departments field from the Me query
 */
export const useUserDepartments = () => {
  const user = useAuthStore((state) => state.user);

  const departments: UserDepartment[] = user?.departments || [];
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
