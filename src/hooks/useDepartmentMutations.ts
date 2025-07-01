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
      update: (cache, { data }) => {
        if (data?.createDepartment) {
          // Update the departments list cache
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
                  items: [
                    data.createDepartment,
                    ...existingDepartments.departments.items,
                  ],
                  meta: {
                    ...existingDepartments.departments.meta,
                    totalItems:
                      existingDepartments.departments.meta.totalItems + 1,
                  },
                },
              },
            });
          }
        }
      },
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
        {
          query: GET_DEPARTMENTS,
        },
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
        {
          query: GET_DEPARTMENTS,
        },
      ],
      awaitRefetchQueries: true,
      update: (cache, { data }) => {
        if (data?.removeDepartment) {
          // Update the departments list cache by removing the deleted department
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
                      department.departmentId !==
                      data.removeDepartment.departmentId
                  ),
                  meta: {
                    ...existingDepartments.departments.meta,
                    totalItems:
                      existingDepartments.departments.meta.totalItems - 1,
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
      onCompleted: () => {
        // Don't show toast for individual employee additions to avoid spam
        // The main department creation toast is sufficient
      },
      onError: (error) => {
        // Only log errors, don't show toast to avoid spam
        console.error("Failed to add employee to department:", error.message);
      },
      // Don't refetch after each individual employee addition
      // We'll handle refetching after all employees are added
    });

  const [
    removeEmployeeFromDepartmentMutation,
    { loading: removeEmployeeLoading },
  ] = useMutation(REMOVE_EMPLOYEE_FROM_DEPARTMENT, {
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
      // First create the department
      const result = await createDepartmentMutation({
        variables: {
          input: variables.input,
        },
      });
      const createdDepartment = result.data?.createDepartment;

      // If employees were specified and department was created successfully, add them
      if (
        createdDepartment &&
        variables.employeeIds &&
        variables.employeeIds.length > 0
      ) {
        console.log(
          `Adding ${variables.employeeIds.length} employees to department ${createdDepartment.departmentId}`
        );

        // Add employees one by one and wait for all to complete
        const employeePromises = variables.employeeIds.map(
          async (employeeId) => {
            try {
              await addEmployeeToDepartmentMutation({
                variables: {
                  departmentId: createdDepartment.departmentId,
                  employeeId: employeeId,
                },
              });
              console.log(
                `Successfully added employee ${employeeId} to department`
              );
              return { success: true, employeeId };
            } catch (error) {
              console.error(
                `Failed to add employee ${employeeId} to department:`,
                error
              );
              return { success: false, employeeId, error };
            }
          }
        );

        // Wait for all employee additions to complete
        const results = await Promise.all(employeePromises);
        console.log("Finished adding employees to department", results);

        // Check if any employee additions failed
        const failedAdditions = results.filter((r) => !r.success);
        if (failedAdditions.length > 0) {
          console.warn(
            `${failedAdditions.length} employee additions failed:`,
            failedAdditions
          );
          toast.error(
            `Department created but failed to add ${failedAdditions.length} member(s)`,
            {
              description:
                "You can manually add them later from the department details.",
            }
          );
        }
      }

      return createdDepartment;
    } catch (error) {
      console.error("Error creating department:", error);
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
      // First update the department basic information
      const result = await updateDepartmentMutation({
        variables: {
          input: variables.input,
        },
      });
      const updatedDepartment = result.data?.updateDepartment;

      // Handle member changes if specified
      if (updatedDepartment && variables.employeeIds !== undefined) {
        const newEmployeeIds = variables.employeeIds || [];
        const currentEmployeeIds = variables.currentEmployeeIds || [];

        console.log("Updating department members:", {
          current: currentEmployeeIds,
          new: newEmployeeIds,
          departmentId: updatedDepartment.departmentId,
        });

        // Find employees to add and remove
        const employeesToAdd = newEmployeeIds.filter(
          (id) => !currentEmployeeIds.includes(id)
        );
        const employeesToRemove = currentEmployeeIds.filter(
          (id) => !newEmployeeIds.includes(id)
        );

        console.log("Member changes:", {
          toAdd: employeesToAdd,
          toRemove: employeesToRemove,
        });

        // Add new employees
        if (employeesToAdd.length > 0) {
          const addPromises = employeesToAdd.map(async (employeeId) => {
            try {
              await addEmployeeToDepartmentMutation({
                variables: {
                  departmentId: updatedDepartment.departmentId,
                  employeeId: employeeId,
                },
              });
              console.log(
                `Successfully added employee ${employeeId} to department`
              );
              return { success: true, employeeId, action: "add" };
            } catch (error) {
              console.error(
                `Failed to add employee ${employeeId} to department:`,
                error
              );
              return { success: false, employeeId, error, action: "add" };
            }
          });

          await Promise.all(addPromises);
        }

        // Remove employees
        if (employeesToRemove.length > 0) {
          const removePromises = employeesToRemove.map(async (employeeId) => {
            try {
              await removeEmployeeFromDepartmentMutation({
                variables: {
                  departmentId: updatedDepartment.departmentId,
                  employeeId: employeeId,
                },
              });
              console.log(
                `Successfully removed employee ${employeeId} from department`
              );
              return { success: true, employeeId, action: "remove" };
            } catch (error) {
              console.error(
                `Failed to remove employee ${employeeId} from department:`,
                error
              );
              return { success: false, employeeId, error, action: "remove" };
            }
          });

          await Promise.all(removePromises);
        }

        console.log("Finished updating department members");
      }

      return updatedDepartment;
    } catch (error) {
      console.error("Error updating department:", error);
      throw error;
    }
  };

  const removeDepartment = async (
    variables: RemoveDepartmentMutationVariables
  ) => {
    try {
      const result = await removeDepartmentMutation({ variables });
      return result.data?.removeDepartment;
    } catch (error) {
      console.error("Error removing department:", error);
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
      console.error("Error adding employee to department:", error);
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
      console.error("Error removing employee from department:", error);
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
