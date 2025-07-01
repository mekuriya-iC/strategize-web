"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_EMPLOYEE,
  UPDATE_EMPLOYEE,
  REMOVE_EMPLOYEE,
} from "@/lib/graphql/mutations/employees";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/types/graphql";

export const useEmployeeMutations = () => {
  // Create Employee Mutation
  const [
    createEmployeeMutation,
    { loading: createLoading, error: createError },
  ] = useMutation(CREATE_EMPLOYEE, {
    // Refetch employees list after creation
    refetchQueries: [{ query: GET_EMPLOYEES }],
    // Optimistically update cache
    update: (cache, { data }) => {
      if (data?.createEmployee) {
        console.log("Employee created:", data.createEmployee);
      }
    },
  });

  // Update Employee Mutation
  const [
    updateEmployeeMutation,
    { loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_EMPLOYEE, {
    refetchQueries: [{ query: GET_EMPLOYEES }],
  });

  // Remove Employee Mutation
  const [
    removeEmployeeMutation,
    { loading: removeLoading, error: removeError },
  ] = useMutation(REMOVE_EMPLOYEE, {
    refetchQueries: [{ query: GET_EMPLOYEES }],
  });

  // Create Employee Function
  const createEmployee = async (input: CreateEmployeeInput) => {
    try {
      const { data } = await createEmployeeMutation({
        variables: { input },
      });
      return { success: true, employee: data?.createEmployee };
    } catch (error) {
      console.error("Create employee error:", error);
      return { success: false, error };
    }
  };

  // Update Employee Function
  const updateEmployee = async (input: UpdateEmployeeInput) => {
    try {
      const { data } = await updateEmployeeMutation({
        variables: { input },
      });
      return { success: true, employee: data?.updateEmployee };
    } catch (error) {
      console.error("Update employee error:", error);
      return { success: false, error };
    }
  };

  // Remove Employee Function
  const removeEmployee = async (employeeId: string) => {
    try {
      const { data } = await removeEmployeeMutation({
        variables: { id: employeeId },
      });
      return {
        success: true,
        deletedEmployee: data?.removeEmployee,
        deletedEmployeeId: employeeId, // Use the original ID since backend can't return it
      };
    } catch (error) {
      console.error("Remove employee error:", error);
      return { success: false, error };
    }
  };

  return {
    // Functions
    createEmployee,
    updateEmployee,
    removeEmployee,

    // Loading states
    createLoading,
    updateLoading,
    removeLoading,

    // Error states
    createError,
    updateError,
    removeError,
  };
};
