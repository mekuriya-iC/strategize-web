"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_EMPLOYEE,
  UPDATE_EMPLOYEE,
  REMOVE_EMPLOYEE,
} from "@/lib/graphql/mutations/employees";

import { CreateEmployeeInput, UpdateEmployeeInput } from "@/types/graphql";
import {
  evictDeletedEntity,
  evictRootFields,
} from "@/lib/graphql/cache-invalidation";
import logger from "@/lib/logger";

const empLogger = logger.createChild("Employee");

export const useEmployeeMutations = () => {
  // ── Create ──────────────────────────────────────────────────────────────────
  const [
    createEmployeeMutation,
    { loading: createLoading, error: createError },
  ] = useMutation(CREATE_EMPLOYEE, {
    update: (cache, { data }) => {
      if (data?.createEmployee) evictRootFields(cache, ["employees"]);
    },
  });

  // ── Update ──────────────────────────────────────────────────────────────────
  const [
    updateEmployeeMutation,
    { loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_EMPLOYEE, {
    // The payload updates the normalized Employee. Evict lists because name,
    // status, department membership, or another filtered/sorted field may change.
    update: (cache, { data }) => {
      if (data?.updateEmployee) evictRootFields(cache, ["employees"]);
    },
  });

  // ── Remove ──────────────────────────────────────────────────────────────────
  const [
    removeEmployeeMutation,
    { loading: removeLoading, error: removeError },
  ] = useMutation(REMOVE_EMPLOYEE, {
    update: (cache, { data }, { variables }) => {
      if (data?.removeEmployee && variables?.employeeId) {
        evictDeletedEntity(cache, ["employees"], {
          __typename: "Employee",
          employeeId: variables.employeeId,
        });
      }
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
