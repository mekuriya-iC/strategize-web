"use client";

import { useMutation, Reference } from "@apollo/client";
import {
  CREATE_EMPLOYEE,
  UPDATE_EMPLOYEE,
  REMOVE_EMPLOYEE,
} from "@/lib/graphql/mutations/employees";
// GET_EMPLOYEES is used in cache updates but not directly referenced
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/types/graphql";

export const useEmployeeMutations = () => {
  // Create Employee Mutation
  const [
    createEmployeeMutation,
    { loading: createLoading, error: createError },
  ] = useMutation(CREATE_EMPLOYEE, {
    update: (cache, { data }) => {
      if (data?.createEmployee) {
        const newEmployee = data.createEmployee;

        // Add the new employee to all cached employee queries
        cache.modify({
          fields: {
            employees(existingEmployees = null) {
              if (!existingEmployees) return existingEmployees;

              const items = existingEmployees.items || [];
              return {
                ...existingEmployees,
                items: [newEmployee, ...items],
                meta: {
                  ...existingEmployees.meta,
                  totalItems: (existingEmployees.meta?.totalItems || 0) + 1,
                },
              };
            },
          },
        });
      }
    },
  });

  // Update Employee Mutation
  const [
    updateEmployeeMutation,
    { loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_EMPLOYEE, {
    update: (cache, { data }) => {
      if (data?.updateEmployee) {
        const updatedEmployee = data.updateEmployee;

        // Update all cached employee queries
        cache.modify({
          fields: {
            employees(existingEmployees = null, { readField }) {
              if (!existingEmployees) return existingEmployees;

              const items = existingEmployees.items || [];
              const updatedItems = items.map((item: Reference) => {
                const employeeId = readField("employeeId", item);
                return employeeId === updatedEmployee.employeeId
                  ? updatedEmployee
                  : item;
              });

              return {
                ...existingEmployees,
                items: updatedItems,
              };
            },
          },
        });
      }
    },
  });

  // Remove Employee Mutation
  const [
    removeEmployeeMutation,
    { loading: removeLoading, error: removeError },
  ] = useMutation(REMOVE_EMPLOYEE, {
    update: (cache, { data }, { variables }) => {
      if (data?.removeEmployee && variables?.id) {
        const deletedEmployeeId = variables.id;

        // Remove the employee from all cached employee queries
        cache.modify({
          fields: {
            employees(existingEmployees = null, { readField }) {
              if (!existingEmployees) return existingEmployees;

              const items = existingEmployees.items || [];
              const filteredItems = items.filter((item: Reference) => {
                const employeeId = readField("employeeId", item);
                return employeeId !== deletedEmployeeId;
              });

              return {
                ...existingEmployees,
                items: filteredItems,
                meta: {
                  ...existingEmployees.meta,
                  totalItems: Math.max(
                    0,
                    (existingEmployees.meta?.totalItems || 0) - 1
                  ),
                },
              };
            },
          },
        });
      }
    },
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
