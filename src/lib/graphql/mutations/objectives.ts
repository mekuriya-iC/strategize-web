import { gql } from "@apollo/client";

/**
 * Objective Mutations
 * Matches backend schema exactly
 */

// Create a new objective
export const CREATE_OBJECTIVE = gql`
  mutation CreateObjective($input: CreateObjectiveInput!) {
    createObjective(createObjectiveInput: $input) {
      objectiveId
      title
      description
      type
      level
      status
      cascadeStatus
      assigneeType
      assigneeId
      weight
      order
      dueDate
      createdAt
      createdBy {
        employeeId
        fullName
      }
      parent {
        objectiveId
        title
      }
    }
  }
`;

// Update an objective
export const UPDATE_OBJECTIVE = gql`
  mutation UpdateObjective($input: UpdateObjectiveInput!) {
    updateObjective(updateObjectiveInput: $input) {
      objectiveId
      title
      description
      type
      level
      status
      cascadeStatus
      assigneeType
      assigneeId
      weight
      order
      dueDate
      updatedAt
      parent {
        objectiveId
        title
      }
      kpis {
        kpiId
        name
        targetValue
        measurementUnit
      }
    }
  }
`;

// Delete an objective
export const DELETE_OBJECTIVE = gql`
  mutation RemoveObjective($objectiveId: ID!) {
    removeObjective(objectiveId: $objectiveId) {
      objectiveId
      title
      isDeleted
    }
  }
`;

// Approve an objective
export const APPROVE_OBJECTIVE = gql`
  mutation ApproveObjective($objectiveId: ID!, $comment: String) {
    approveObjective(objectiveId: $objectiveId, comment: $comment) {
      objectiveId
      title
      status
      approvedAt
      approvedBy {
        employeeId
        fullName
      }
    }
  }
`;

// Reject an objective
export const REJECT_OBJECTIVE = gql`
  mutation RejectObjective($objectiveId: ID!, $reason: String!) {
    rejectObjective(objectiveId: $objectiveId, reason: $reason) {
      objectiveId
      title
      status
    }
  }
`;

// Cascade objective to lower levels
export const CASCADE_OBJECTIVE = gql`
  mutation CascadeObjective($input: CascadeObjectiveInput!) {
    cascadeObjective(cascadeObjectiveInput: $input) {
      objectiveId
      title
      cascadeStatus
      children {
        objectiveId
        title
        type
        level
        assigneeType
        assigneeId
        parent {
          objectiveId
        }
        kpis {
          kpiId
          name
          parent {
            kpiId
          }
          targetValue
          calculationBasisSource
          actualBasisSource
          directBasisValue
        }
      }
    }
  }
`;

// Atomically cascade to recipients that may belong to different hierarchy levels.
export const CASCADE_OBJECTIVE_V2 = gql`
  mutation CascadeObjectiveV2($input: CascadeObjectiveV2Input!) {
    cascadeObjectiveV2(cascadeObjectiveV2Input: $input) {
      parentObjective {
        objectiveId
        cascadeStatus
      }
      children {
        objectiveId
        assigneeType
        assigneeId
      }
      createdCount
      updatedCount
    }
  }
`;

// Assign objective to employee/department/division
export const ASSIGN_OBJECTIVE = gql`
  mutation AssignObjective($input: AssignObjectiveInput!) {
    assignObjective(assignObjectiveInput: $input) {
      objectiveId
      title
      type
      level
      assigneeType
      assigneeId
      kpis {
        kpiId
        name
        kpiMode
        managerRetentionPercent
        targetValue
        assignedTargetValue
        unitType
        quarterlyAggregationMethod
        measurementUnit
        calculationBasisSource
        actualBasisSource
        directBasisValue
        directBasisTargets {
          timeline
          value
        }
        numeratorLabel
        denominatorLabel
        basisUnitType
        aggregationMethod
        weightingBasisKpiId
        parent {
          kpiId
          name
        }
      }
      ownerUser {
        employeeId
        fullName
      }
    }
  }
`;

// Reorder objectives
export const REORDER_OBJECTIVES = gql`
  mutation ReorderObjectives($input: [ReorderObjectiveInput!]!) {
    reorderObjectives(reorderObjectivesInput: $input) {
      objectiveId
      order
    }
  }
`;

// Alias for consistency
export const UPDATE_OBJECTIVES_ORDER = REORDER_OBJECTIVES;

// Update objective status
export const UPDATE_OBJECTIVE_STATUS = gql`
  mutation UpdateObjectiveStatus($objectiveId: ID!, $status: ObjectiveStatus!) {
    updateObjectiveStatus(objectiveId: $objectiveId, status: $status) {
      objectiveId
      title
      status
      updatedAt
    }
  }
`;
