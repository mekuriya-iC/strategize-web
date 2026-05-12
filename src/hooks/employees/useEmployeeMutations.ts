"use client";

import { useMutation, Reference } from "@apollo/client";
import {
  CREATE_EMPLOYEE,
  UPDATE_EMPLOYEE,
  REMOVE_EMPLOYEE,
} from "@/lib/graphql/mutations/employees";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/types/graphql";
import { invalidateAfterMutation } from "@/stores/cacheStore";
import logger from "@/lib/logger";

const empLogger = logger.createChild("Employee");

export const useEmployeeMutations = () => {
  // ── Create ──────────────────────────────────────────────────────────────────
  const [
    createEmployeeMutation,
    { loading: createLoading, error: createError },
  ] = useMutation(CREATE_EMPLOYEE, {
    // Optimistically prepend to the list, then refetch to get server-confirmed data
    update: (cache, { data }) => {
      if (data?.createEmployee) {
        cache.modify({
          fields: {
            employees(existingEmployees = null) {
              if (!existingEmployees) return existingEmployees;
              const items = existingEmployees.items || [];
              return {
                ...existingEmployees,
                items: [data.createEmployee, ...items],
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
    // Refetch all active employee queries so every table/list reflects the change
    refetchQueries: "active",
    onCompleted: () => {
      invalidateAfterMutation.employee();
    },
  });

  // ── Update ──────────────────────────────────────────────────────────────────
  const [
    updateEmployeeMutation,
    { loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_EMPLOYEE, {
    update: (cache, { data }) => {
      if (data?.updateEmployee) {
        const updated = data.updateEmployee;
        cache.modify({
          fields: {
            employees(existingEmployees = null, { readField }) {
              if (!existingEmployees) return existingEmployees;
              const items = existingEmployees.items || [];
              return {
                ...existingEmployees,
                items: items.map((item: Reference) =>
                  readField("employeeId", item) === updated.employeeId
                    ? updated
                    : item
                ),
              };
            },
          },
        });
      }
    },
    refetchQueries: "active",
    onCompleted: () => {
      invalidateAfterMutation.employee();
    },
  });

  // ── Remove ──────────────────────────────────────────────────────────────────
  const [
    removeEmployeeMutation,
    { loading: removeLoading, error: removeError },
  ] = useMutation(REMOVE_EMPLOYEE, {
    update: (cache, { data }, { variables }) => {
      if (data?.removeEmployee && variables?.employeeId) {
        const deletedId = variables.employeeId;
        cache.modify({
          fields: {
            employees(existingEmployees = null, { readField }) {
              if (!existingEmployees) return existingEmployees;
              const items = existingEmployees.items || [];
              return {
                ...existingEmployees,
                items: items.filter(
                  (item: Reference) =>
                    readField("employeeId", item) !== deletedId
                ),
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
    refetchQueries: "active",
    onCompleted: () => {
      invalidateAfterMutation.employee();
    },
  });

  // ── Public API ──────────────────────────────────────────────────────────────

  const createEmployee = async (input: CreateEmployeeInput) => {
    try {
      const { data } = await createEmployeeMutation({
        variables: { createEmployeeInput: input },
      });
      return { success: true, employee: data?.createEmployee };
    } catch (error) {
      empLogger.error("Create employee error:", error);
      return { success: false, error };
    }
  };

  const updateEmployee = async (input: UpdateEmployeeInput) => {
    try {
      const { data } = await updateEmployeeMutation({
        variables: { updateEmployeeInput: input },
      });
      return { success: true, employee: data?.updateEmployee };
    } catch (error) {
      empLogger.error("Update employee error:", error);
      return { success: false, error };
    }
  };

  const removeEmployee = async (employeeId: string) => {
    try {
      const { data } = await removeEmployeeMutation({
        variables: { employeeId },
      });
      return {
        success: true,
        deletedEmployee: data?.removeEmployee,
        deletedEmployeeId: employeeId,
      };
    } catch (error) {
      empLogger.error("Remove employee error:", error);
      return { success: false, error };
    }
  };

  return {
    createEmployee,
    updateEmployee,
    removeEmployee,
    createLoading,
    updateLoading,
    removeLoading,
    createError,
    updateError,
    removeError,
  };
};
