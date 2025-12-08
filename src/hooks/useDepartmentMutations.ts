import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  CREATE_DEPARTMENT,
  UPDATE_DEPARTMENT,
  REMOVE_DEPARTMENT,
  ADD_EMPLOYEE_TO_DEPARTMENT,
  REMOVE_EMPLOYEE_FROM_DEPARTMENT,
} from "@/lib/graphql/mutations/departments";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import type {
  CreateDepartmentMutationVariables,
  UpdateDepartmentMutationVariables,
  RemoveDepartmentMutationVariables,
  AddEmployeeToDepartmentMutationVariables,
  RemoveEmployeeFromDepartmentMutationVariables,
  PaginatedDepartments,
} from "@/types/graphql";
import logger from "@/lib/logger";

const deptLogger = logger.createChild("Department");

export const useDepartmentMutations = () => {
  const [createDepartmentMutation, { loading: createLoading }] = useMutation(
    CREATE_DEPARTMENT,
    {
      onCompleted: (data) => {
        toast.success("Department created successfully!", {
          description: `${data.createDepartment.name} has been added to the system.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to create department", {
          description: error.message,
        });
      },
      refetchQueries: [
        { query: GET_DEPARTMENTS },
        { query: GET_DEPARTMENTS, variables: { page: 1, limit: 10 } },
        { query: GET_DEPARTMENTS, variables: { page: 1, limit: 100 } },
        { query: GET_DEPARTMENTS, variables: { page: 1, limit: 1000 } },
      ],
      awaitRefetchQueries: true,
    }
  );

  const [updateDepartmentMutation, { loading: updateLoading }] = useMutation(
    UPDATE_DEPARTMENT,
    {
      onCompleted: (data) => {
        toast.success("Department updated successfully!", {
          description: `${data.updateDepartment.name} has been updated.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to update department", {
          description: error.message,
        });
      },
      refetchQueries: [
        { query: GET_DEPARTMENTS },
        { query: GET_DEPARTMENTS, variables: { page: 1, limit: 1000 } },
        { query: GET_DEPARTMENTS, variables: { page: 1, limit: 100 } },
      ],
      awaitRefetchQueries: true,
    }
  );

  const [removeDepartmentMutation, { loading: removeLoading }] = useMutation(
    REMOVE_DEPARTMENT,
    {
      onCompleted: (data) => {
        toast.success("Department deleted successfully!", {
          description: `${data.removeDepartment.name} has been removed from the system.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to delete department", {
          description: error.message,
        });
      },
      refetchQueries: [
        { query: GET_DEPARTMENTS },
        { query: GET_DEPARTMENTS, variables: { page: 1, limit: 1000 } },
        { query: GET_DEPARTMENTS, variables: { page: 1, limit: 100 } },
      ],
      awaitRefetchQueries: true,
      update: (cache, { data }) => {
        if (data?.removeDepartment) {
          const existingDepartments = cache.readQuery<{
            departments: PaginatedDepartments;
          }>({
            query: GET_DEPARTMENTS,
            variables: { page: 1, limit: 10 },
          });

          if (existingDepartments) {
            cache.writeQuery({
              query: GET_DEPARTMENTS,
              variables: { page: 1, limit: 10 },
              data: {
                departments: {
                  ...existingDepartments.departments,
                  items: existingDepartments.departments.items.filter(
                    (department) =>
                      department.departmentId !== data.removeDepartment.departmentId
                  ),
                  meta: {
                    ...existingDepartments.departments.meta,
                    totalItems: existingDepartments.departments.meta.totalItems - 1,
                  },
                },
              },
            });
          }
        }
      },
    }
  );

  const [addEmployeeToDepartmentMutation, { loading: addEmployeeLoading }] =
    useMutation(ADD_EMPLOYEE_TO_DEPARTMENT, {
      onError: (error) => {
        deptLogger.error("Failed to add employee to department:", error.message);
      },
    });

  const [removeEmployeeFromDepartmentMutation, { loading: removeEmployeeLoading }] =
    useMutation(REMOVE_EMPLOYEE_FROM_DEPARTMENT, {
      onCompleted: (data) => {
        toast.success("Employee removed from department successfully!", {
          description: `Employee has been removed from ${data.removeEmployeeFromDepartment.name}.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to remove employee from department", {
          description: error.message,
        });
      },
    });

  const createDepartment = async (
    variables: CreateDepartmentMutationVariables & { employeeIds?: string[] }
  ) => {
    try {
      const result = await createDepartmentMutation({
        variables: { input: variables.input },
      });
      const createdDepartment = result.data?.createDepartment;

      if (createdDepartment && variables.employeeIds && variables.employeeIds.length > 0) {
        deptLogger.debug(`Adding ${variables.employeeIds.length} employees to department`);

        const employeePromises = variables.employeeIds.map(async (employeeId) => {
          try {
            await addEmployeeToDepartmentMutation({
              variables: {
                departmentId: createdDepartment.departmentId,
                employeeId: employeeId,
              },
            });
            return { success: true, employeeId };
          } catch (error) {
            deptLogger.error(`Failed to add employee ${employeeId} to department:`, error);
            return { success: false, employeeId, error };
          }
        });

        const results = await Promise.all(employeePromises);
        const failedAdditions = results.filter((r) => !r.success);

        if (failedAdditions.length > 0) {
          deptLogger.warn(`${failedAdditions.length} employee additions failed`);
          toast.error(
            `Department created but failed to add ${failedAdditions.length} member(s)`,
            { description: "You can manually add them later from the department details." }
          );
        }
      }

      return createdDepartment;
    } catch (error) {
      deptLogger.error("Error creating department:", error);
      throw error;
    }
  };

  const updateDepartment = async (
    variables: UpdateDepartmentMutationVariables & {
      employeeIds?: string[];
      currentEmployeeIds?: string[];
    }
  ) => {
    try {
      const result = await updateDepartmentMutation({
        variables: { input: variables.input },
      });
      const updatedDepartment = result.data?.updateDepartment;

      if (updatedDepartment && variables.employeeIds !== undefined) {
        const newEmployeeIds = variables.employeeIds || [];
        const currentEmployeeIds = variables.currentEmployeeIds || [];

        const employeesToAdd = newEmployeeIds.filter((id) => !currentEmployeeIds.includes(id));
        const employeesToRemove = currentEmployeeIds.filter((id) => !newEmployeeIds.includes(id));

        if (employeesToAdd.length > 0) {
          const addPromises = employeesToAdd.map(async (employeeId) => {
            try {
              await addEmployeeToDepartmentMutation({
                variables: {
                  departmentId: updatedDepartment.departmentId,
                  employeeId: employeeId,
                },
              });
              return { success: true, employeeId };
            } catch (error) {
              deptLogger.error(`Failed to add employee ${employeeId}:`, error);
              return { success: false, employeeId, error };
            }
          });
          await Promise.all(addPromises);
        }

        if (employeesToRemove.length > 0) {
          const removePromises = employeesToRemove.map(async (employeeId) => {
            try {
              await removeEmployeeFromDepartmentMutation({
                variables: {
                  departmentId: updatedDepartment.departmentId,
                  employeeId: employeeId,
                },
              });
              return { success: true, employeeId };
            } catch (error) {
              deptLogger.error(`Failed to remove employee ${employeeId}:`, error);
              return { success: false, employeeId, error };
            }
          });
          await Promise.all(removePromises);
        }
      }

      return updatedDepartment;
    } catch (error) {
      deptLogger.error("Error updating department:", error);
      throw error;
    }
  };

  const removeDepartment = async (variables: RemoveDepartmentMutationVariables) => {
    try {
      const result = await removeDepartmentMutation({ variables });
      return result.data?.removeDepartment;
    } catch (error) {
      deptLogger.error("Error removing department:", error);
      throw error;
    }
  };

  const addEmployeeToDepartment = async (
    variables: AddEmployeeToDepartmentMutationVariables
  ) => {
    try {
      const result = await addEmployeeToDepartmentMutation({ variables });
      return result.data?.addEmployeeToDepartment;
    } catch (error) {
      deptLogger.error("Error adding employee to department:", error);
      throw error;
    }
  };

  const removeEmployeeFromDepartment = async (
    variables: RemoveEmployeeFromDepartmentMutationVariables
  ) => {
    try {
      const result = await removeEmployeeFromDepartmentMutation({ variables });
      return result.data?.removeEmployeeFromDepartment;
    } catch (error) {
      deptLogger.error("Error removing employee from department:", error);
      throw error;
    }
  };

  return {
    createDepartment,
    updateDepartment,
    removeDepartment,
    addEmployeeToDepartment,
    removeEmployeeFromDepartment,
    loading: {
      create: createLoading,
      update: updateLoading,
      remove: removeLoading,
      addEmployee: addEmployeeLoading,
      removeEmployee: removeEmployeeLoading,
    },
  };
};
