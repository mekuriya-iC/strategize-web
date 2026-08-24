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
import { GET_KPIS, GET_KPI } from "@/lib/graphql/queries/kpis";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
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
import { invalidateAfterMutation } from "@/stores/cacheStore";

export const useKPIMutations = () => {
  const [createKpi, { loading: createLoading, error: createError }] =
    useMutation(CREATE_KPI, {
      errorPolicy: "none",
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 1000 } },
        "GetObjectives",
      ],
    });

  const [updateKpi, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_KPI, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 1000 } },
        "GetObjectives",
        "GetKpi",
      ],
    });

  const [deleteKpi, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_KPI, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [createKpiUpdate, { loading: createUpdateLoading, error: createUpdateError }] =
    useMutation(CREATE_KPI_UPDATE, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [updateKpiProgress, { loading: updateProgressLoading, error: updateProgressError }] =
    useMutation(UPDATE_KPI_PROGRESS, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [approveKpiUpdate, { loading: approveLoading, error: approveError }] =
    useMutation(APPROVE_KPI_UPDATE, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [assignKpiToEmployee, { loading: assignEmployeeLoading, error: assignEmployeeError }] =
    useMutation(CREATE_KPI_ASSIGNMENT_EMPLOYEE, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [assignKpiToDepartment, { loading: assignDepartmentLoading, error: assignDepartmentError }] =
    useMutation(CREATE_KPI_ASSIGNMENT_DEPARTMENT, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [assignKpiToDivision, { loading: assignDivisionLoading, error: assignDivisionError }] =
    useMutation(CREATE_KPI_ASSIGNMENT_DIVISION, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [removeKpiAssignmentEmployee, { loading: removeEmployeeLoading, error: removeEmployeeError }] =
    useMutation(REMOVE_KPI_ASSIGNMENT_EMPLOYEE, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [removeKpiAssignmentDepartment, { loading: removeDepartmentLoading, error: removeDepartmentError }] =
    useMutation(REMOVE_KPI_ASSIGNMENT_DEPARTMENT, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [removeKpiAssignmentDivision, { loading: removeDivisionLoading, error: removeDivisionError }] =
    useMutation(REMOVE_KPI_ASSIGNMENT_DIVISION, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [updateKpiStatus, { loading: statusLoading, error: statusError }] =
    useMutation(UPDATE_KPI_STATUS, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [toggleKpiActive, { loading: toggleLoading, error: toggleError }] =
    useMutation(TOGGLE_KPI_ACTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [createSharedKpi, { loading: createSharedLoading, error: createSharedError }] =
    useMutation(CREATE_SHARED_KPI, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [createSharedKpiParticipant, { loading: createParticipantLoading, error: createParticipantError }] =
    useMutation(CREATE_SHARED_KPI_PARTICIPANT, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [updateSharedKpiParticipant, { loading: updateParticipantLoading, error: updateParticipantError }] =
    useMutation(UPDATE_SHARED_KPI_PARTICIPANT, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

  const [removeSharedKpiParticipant, { loading: removeParticipantLoading, error: removeParticipantError }] =
    useMutation(REMOVE_SHARED_KPI_PARTICIPANT, {
      onCompleted: () => {
        invalidateAfterMutation.kpi();
      },
      refetchQueries: [
        { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      ],
    });

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
      return result.data?.deleteKpi;
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

  const handleCreateSharedKpiParticipant = async (variables: any) => {
    try {
      const result = await createSharedKpiParticipant({ variables });
      return result.data?.createSharedKpiParticipant;
    } catch (error) {
      console.error("Error creating shared KPI participant:", error);
      throw error;
    }
  };

  const handleUpdateSharedKpiParticipant = async (variables: any) => {
    try {
      const result = await updateSharedKpiParticipant({ variables });
      return result.data?.updateSharedKpiParticipant;
    } catch (error) {
      console.error("Error updating shared KPI participant:", error);
      throw error;
    }
  };

  const handleRemoveSharedKpiParticipant = async (variables: any) => {
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
