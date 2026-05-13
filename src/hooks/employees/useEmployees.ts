import { useQuery } from '@apollo/client';
import { GET_EMPLOYEES, GET_EMPLOYEE, GET_DIRECT_REPORTS } from '@/lib/graphql/queries/employees';

export const useEmployees = (page = 1, limit = 10, search = '') => {
  const { data, loading, error, refetch } = useQuery(GET_EMPLOYEES, {
    variables: { page, limit, search },
    fetchPolicy: 'cache-and-network',
  });

  return {
    employees: data?.employees?.items || [],
    meta: data?.employees?.meta,
    loading,
    error,
    refetch,
  };
};

export const useEmployee = (employeeId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_EMPLOYEE, {
    variables: { employeeId },
    skip: !employeeId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    employee: data?.employee,
    loading,
    error,
    refetch,
  };
};

export const useDirectReports = (managerId?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_DIRECT_REPORTS, {
    variables: { managerId },
    fetchPolicy: 'cache-and-network',
  });

  return {
    directReports: data?.directReports || [],
    loading,
    error,
    refetch,
  };
};
