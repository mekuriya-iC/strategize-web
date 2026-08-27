import { useMutation } from "@apollo/client";
import {
  CREATE_KPI,
  UPDATE_KPI,
  DELETE_KPI,
  CREATE_KPI_UPDATE,
  UPDATE_KPI_PROGRESS,
  APPROVE_KPI_UPDATE,
  CREATE_KPI_ASSIGNMENT_EMPLOYEE,
  CREATE_KPI_ASSIGNMENT_DEPARTMENT,
  CREATE_KPI_ASSIGNMENT_DIVISION,
  REMOVE_KPI_ASSIGNMENT_EMPLOYEE,
  REMOVE_KPI_ASSIGNMENT_DEPARTMENT,
  REMOVE_KPI_ASSIGNMENT_DIVISION,
  UPDATE_KPI_STATUS,
  TOGGLE_KPI_ACTIVE,
  CREATE_SHARED_KPI,
  CREATE_SHARED_KPI_PARTICIPANT,
  UPDATE_SHARED_KPI_PARTICIPANT,
  REMOVE_SHARED_KPI_PARTICIPANT,
} from "@/lib/graphql/mutations/kpis";
import { evictDeletedEntity, evictRootFields } from "@/lib/graphql/cache-invalidation";
import {
  CreateKpiMutationVariables,
  UpdateKpiMutationVariables,
  DeleteKpiMutationVariables,
  CreateKpiUpdateMutationVariables,
  UpdateKpiProgressMutationVariables,
  ApproveKpiUpdateMutationVariables,
  AssignKpiToEmployeeMutationVariables,
  AssignKpiToDepartmentMutationVariables,
  AssignKpiToDivisionMutationVariables,
  RemoveKpiAssignmentEmployeeMutationVariables,
  RemoveKpiAssignmentDepartmentMutationVariables,
  RemoveKpiAssignmentDivisionMutationVariables,
  UpdateKpiStatusMutationVariables,
  ToggleKpiActiveMutationVariables,
  CreateSharedKpiMutationVariables,
} from "@/types/graphql";

export const useKPIMutations = () => {
  const invalidateKpiLists = (cache: Parameters<typeof evictRootFields>[0]) =>
    evictRootFields(cache, ["kpis", "kpisByObjective", "objectives"]);
  const listOptions = { update: invalidateKpiLists };

  const [createKpi, { loading: createLoading, error: createError }] =
    useMutation(CREATE_KPI, { errorPolicy: "none", ...listOptions });
  const [updateKpi, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_KPI, listOptions);
  const [deleteKpi, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_KPI, {
      update: (cache, { data }, { variables }) => {
        const kpiId = variables?.kpiId ?? data?.removeKpi?.kpiId;
        if (kpiId) {
          evictDeletedEntity(cache, ["kpis", "kpisByObjective", "objectives"], {
            __typename: "Kpi",
            kpiId,
          });
        }
      },
    });
  const [createKpiUpdate, { loading: createUpdateLoading, error: createUpdateError }] =
    useMutation(CREATE_KPI_UPDATE, listOptions);
  const [updateKpiProgress, { loading: updateProgressLoading, error: updateProgressError }] =
    useMutation(UPDATE_KPI_PROGRESS, listOptions);
  const [approveKpiUpdate, { loading: approveLoading, error: approveError }] =
    useMutation(APPROVE_KPI_UPDATE, listOptions);
  const [assignKpiToEmployee, { loading: assignEmployeeLoading, error: assignEmployeeError }] =
    useMutation(CREATE_KPI_ASSIGNMENT_EMPLOYEE, listOptions);
  const [assignKpiToDepartment, { loading: assignDepartmentLoading, error: assignDepartmentError }] =
    useMutation(CREATE_KPI_ASSIGNMENT_DEPARTMENT, listOptions);
  const [assignKpiToDivision, { loading: assignDivisionLoading, error: assignDivisionError }] =
    useMutation(CREATE_KPI_ASSIGNMENT_DIVISION, listOptions);
  const [removeKpiAssignmentEmployee, { loading: removeEmployeeLoading, error: removeEmployeeError }] =
    useMutation(REMOVE_KPI_ASSIGNMENT_EMPLOYEE, listOptions);
  const [removeKpiAssignmentDepartment, { loading: removeDepartmentLoading, error: removeDepartmentError }] =
    useMutation(REMOVE_KPI_ASSIGNMENT_DEPARTMENT, listOptions);
  const [removeKpiAssignmentDivision, { loading: removeDivisionLoading, error: removeDivisionError }] =
    useMutation(REMOVE_KPI_ASSIGNMENT_DIVISION, listOptions);
  const [updateKpiStatus, { loading: statusLoading, error: statusError }] =
    useMutation(UPDATE_KPI_STATUS, listOptions);
  const [toggleKpiActive, { loading: toggleLoading, error: toggleError }] =
    useMutation(TOGGLE_KPI_ACTIVE, listOptions);
  const [createSharedKpi, { loading: createSharedLoading, error: createSharedError }] =
    useMutation(CREATE_SHARED_KPI, listOptions);
  const [createSharedKpiParticipant, { loading: createParticipantLoading, error: createParticipantError }] =
    useMutation(CREATE_SHARED_KPI_PARTICIPANT, listOptions);
  const [updateSharedKpiParticipant, { loading: updateParticipantLoading, error: updateParticipantError }] =
    useMutation(UPDATE_SHARED_KPI_PARTICIPANT, listOptions);
  const [removeSharedKpiParticipant, { loading: removeParticipantLoading, error: removeParticipantError }] =
    useMutation(REMOVE_SHARED_KPI_PARTICIPANT, listOptions);

  const handleCreateKpi = async (variables: CreateKpiMutationVariables) => {
    try {
      const result = await createKpi({ variables });
      const createdKpi = result.data?.createKpi;
      if (!createdKpi) {
        throw new Error(
          "KPI creation failed because the server returned no created KPI.",
        );
      }
      return createdKpi;
    } catch (error) {
      console.error("Error creating KPI:", error);
      throw error;
    }
  };

  const handleUpdateKpi = async (variables: UpdateKpiMutationVariables) => {
    try {
      const result = await updateKpi({ variables });
      return result.data?.updateKpi;
    } catch (error) {
      console.error("Error updating KPI:", error);
      throw error;
    }
  };

  const handleDeleteKpi = async (variables: DeleteKpiMutationVariables) => {
    try {
      const result = await deleteKpi({ variables });
      return result.data?.removeKpi;
    } catch (error) {
      console.error("Error deleting KPI:", error);
      throw error;
    }
  };

  const handleCreateKpiUpdate = async (variables: CreateKpiUpdateMutationVariables) => {
    try {
      const result = await createKpiUpdate({ variables });
      return result.data?.createKpiUpdate;
    } catch (error) {
      console.error("Error creating KPI update:", error);
      throw error;
    }
  };

  const handleUpdateKpiProgress = async (variables: UpdateKpiProgressMutationVariables) => {
    try {
      const result = await updateKpiProgress({ variables });
      return result.data?.updateKpiUpdate;
    } catch (error) {
      console.error("Error updating KPI progress:", error);
      throw error;
    }
  };

  const handleApproveKpiUpdate = async (variables: ApproveKpiUpdateMutationVariables) => {
    try {
      const result = await approveKpiUpdate({ variables });
      return result.data?.approveKpiUpdate;
    } catch (error) {
      console.error("Error approving KPI update:", error);
      throw error;
    }
  };

  const handleAssignKpiToEmployee = async (variables: AssignKpiToEmployeeMutationVariables) => {
    try {
      const result = await assignKpiToEmployee({ variables });
      return result.data?.assignKpiToEmployee;
    } catch (error) {
      console.error("Error assigning KPI to employee:", error);
      throw error;
    }
  };

  const handleAssignKpiToDepartment = async (variables: AssignKpiToDepartmentMutationVariables) => {
    try {
      const result = await assignKpiToDepartment({ variables });
      return result.data?.assignKpiToDepartment;
    } catch (error) {
      console.error("Error assigning KPI to department:", error);
      throw error;
    }
  };

  const handleAssignKpiToDivision = async (variables: AssignKpiToDivisionMutationVariables) => {
    try {
      const result = await assignKpiToDivision({ variables });
      return result.data?.assignKpiToDivision;
    } catch (error) {
      console.error("Error assigning KPI to division:", error);
      throw error;
    }
  };

  const handleRemoveKpiAssignmentEmployee = async (variables: RemoveKpiAssignmentEmployeeMutationVariables) => {
    try {
      const result = await removeKpiAssignmentEmployee({ variables });
      return result.data?.removeKpiAssignmentEmployee;
    } catch (error) {
      console.error("Error removing KPI assignment from employee:", error);
      throw error;
    }
  };

  const handleRemoveKpiAssignmentDepartment = async (variables: RemoveKpiAssignmentDepartmentMutationVariables) => {
    try {
      const result = await removeKpiAssignmentDepartment({ variables });
      return result.data?.removeKpiAssignmentDepartment;
    } catch (error) {
      console.error("Error removing KPI assignment from department:", error);
      throw error;
    }
  };

  const handleRemoveKpiAssignmentDivision = async (variables: RemoveKpiAssignmentDivisionMutationVariables) => {
    try {
      const result = await removeKpiAssignmentDivision({ variables });
      return result.data?.removeKpiAssignmentDivision;
    } catch (error) {
      console.error("Error removing KPI assignment from division:", error);
      throw error;
    }
  };

  const handleUpdateKpiStatus = async (variables: UpdateKpiStatusMutationVariables) => {
    try {
      const result = await updateKpiStatus({ variables });
      return result.data?.updateKpiStatus;
    } catch (error) {
      console.error("Error updating KPI status:", error);
      throw error;
    }
  };

  const handleToggleKpiActive = async (variables: ToggleKpiActiveMutationVariables) => {
    try {
      const result = await toggleKpiActive({ variables });
      return result.data?.toggleKpiActive;
    } catch (error) {
      console.error("Error toggling KPI active status:", error);
      throw error;
    }
  };

  const handleCreateSharedKpi = async (variables: CreateSharedKpiMutationVariables) => {
    try {
      const result = await createSharedKpi({ variables });
      return result.data?.createSharedKpi;
    } catch (error) {
      console.error("Error creating shared KPI:", error);
      throw error;
    }
  };

  const handleCreateSharedKpiParticipant = async (
      variables: Record<string, unknown>,
    ) => {
    try {
      const result = await createSharedKpiParticipant({ variables });
      return result.data?.createSharedKpiParticipant;
    } catch (error) {
      console.error("Error creating shared KPI participant:", error);
      throw error;
    }
  };

  const handleUpdateSharedKpiParticipant = async (
      variables: Record<string, unknown>,
    ) => {
    try {
      const result = await updateSharedKpiParticipant({ variables });
      return result.data?.updateSharedKpiParticipant;
    } catch (error) {
      console.error("Error updating shared KPI participant:", error);
      throw error;
    }
  };

  const handleRemoveSharedKpiParticipant = async (
      variables: Record<string, unknown>,
    ) => {
    try {
      const result = await removeSharedKpiParticipant({ variables });
      return result.data?.removeSharedKpiParticipant;
    } catch (error) {
      console.error("Error removing shared KPI participant:", error);
      throw error;
    }
  };

  return {
    createKpi: handleCreateKpi,
    updateKpi: handleUpdateKpi,
    deleteKpi: handleDeleteKpi,
    createKpiUpdate: handleCreateKpiUpdate,
    updateKpiProgress: handleUpdateKpiProgress,
    approveKpiUpdate: handleApproveKpiUpdate,
    assignKpiToEmployee: handleAssignKpiToEmployee,
    assignKpiToDepartment: handleAssignKpiToDepartment,
    assignKpiToDivision: handleAssignKpiToDivision,
    removeKpiAssignmentEmployee: handleRemoveKpiAssignmentEmployee,
    removeKpiAssignmentDepartment: handleRemoveKpiAssignmentDepartment,
    removeKpiAssignmentDivision: handleRemoveKpiAssignmentDivision,
    updateKpiStatus: handleUpdateKpiStatus,
    toggleKpiActive: handleToggleKpiActive,
    createSharedKpi: handleCreateSharedKpi,
    createSharedKpiParticipant: handleCreateSharedKpiParticipant,
    updateSharedKpiParticipant: handleUpdateSharedKpiParticipant,
    removeSharedKpiParticipant: handleRemoveSharedKpiParticipant,
    loading: createLoading || updateLoading || deleteLoading || createUpdateLoading || 
             updateProgressLoading || approveLoading || assignEmployeeLoading || 
             assignDepartmentLoading || assignDivisionLoading || removeEmployeeLoading || 
             removeDepartmentLoading || removeDivisionLoading || statusLoading || 
             toggleLoading || createSharedLoading || createParticipantLoading || 
             updateParticipantLoading || removeParticipantLoading,
    error: createError || updateError || deleteError || createUpdateError || 
           updateProgressError || approveError || assignEmployeeError || 
           assignDepartmentError || assignDivisionError || removeEmployeeError || 
           removeDepartmentError || removeDivisionError || statusError || 
           toggleError || createSharedError || createParticipantError || 
           updateParticipantError || removeParticipantError,
  };
};
