import { gql } from '@apollo/client';

/**
 * Shared KPI Participant Queries
 */
export const GET_SHARED_KPI_PARTICIPANTS = gql`
  query GetSharedKpiParticipants(
    $page: Int!
    $limit: Int!
    $kpiId: ID
    $participantUserId: ID
    $strategicPeriodId: ID
  ) {
    sharedKpiParticipants(
      page: $page
      limit: $limit
      kpiId: $kpiId
      participantUserId: $participantUserId
      strategicPeriodId: $strategicPeriodId
    ) {
      items {
        sharedKpiParticipantId
        contributionWeight
        createdAt
        kpi {
          kpiId
          name
          description
          targetValue
          currentValue
          progress
          unit
        }
        participant {
          employeeId
          fullName
          email
          picture
          title
        }
        assignedBy {
          employeeId
          fullName
        }
        strategicPeriod {
          strategicPeriodId
          name
          startDate
          endDate
        }
      }
      meta {
        totalItems
        totalPages
        currentPage
        itemsPerPage
        itemCount
      }
    }
  }
`;

export const GET_SHARED_KPI_PARTICIPANT = gql`
  query GetSharedKpiParticipant($sharedKpiParticipantId: ID!) {
    sharedKpiParticipant(sharedKpiParticipantId: $sharedKpiParticipantId) {
      sharedKpiParticipantId
      contributionWeight
      createdAt
      kpi {
        kpiId
        name
        description
        targetValue
        currentValue
        progress
        unit
        status
      }
      participant {
        employeeId
        fullName
        email
        picture
        title
        department {
          departmentId
          name
        }
      }
      assignedBy {
        employeeId
        fullName
        email
      }
      strategicPeriod {
        strategicPeriodId
        name
        startDate
        endDate
        periodType
      }
    }
  }
`;
