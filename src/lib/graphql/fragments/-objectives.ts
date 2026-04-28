import { gql } from '@apollo/client';

/**
 * Objectives fragment
 * Contains all common fields for objectives
 */
export const ObjectivesFragment = gql`
  fragment ObjectivesFragment on Objective {
    objectiveId
    title
    description
    type
    status
    level
    cascadeStatus
    weight
    order
    dueDate
    isDeleted
    createdAt
    updatedAt
    approvedAt
    assigneeId
    assigneeType
    assignerId
    createdBy {
      employeeId
      fullName
      email
    }
    approvedBy {
      employeeId
      fullName
      email
    }
    ownerUser {
      employeeId
      fullName
      email
      title
    }
    parent {
      objectiveId
      title
      level
      type
      assigneeType
    }
    strategicPeriod {
      strategicPeriodId
      name
      startDate
      endDate
      status
    }
    kpis {
      kpiId
      name
      weight
      status
      targetStatus
    }
  }
`;
