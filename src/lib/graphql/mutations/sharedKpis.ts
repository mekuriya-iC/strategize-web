import { gql } from '@apollo/client';

/**
 * Shared KPI Participant Mutations
 */
export const CREATE_SHARED_KPI_PARTICIPANT = gql`
  mutation CreateSharedKpiParticipant(
    $createSharedKpiParticipantInput: CreateSharedKpiParticipantInput!
  ) {
    createSharedKpiParticipant(
      createSharedKpiParticipantInput: $createSharedKpiParticipantInput
    ) {
      sharedKpiParticipantId
      contributionWeight
      kpi {
        kpiId
        name
      }
      participant {
        employeeId
        fullName
      }
      createdAt
    }
  }
`;

export const REMOVE_SHARED_KPI_PARTICIPANT = gql`
  mutation RemoveSharedKpiParticipant($sharedKpiParticipantId: ID!) {
    removeSharedKpiParticipant(sharedKpiParticipantId: $sharedKpiParticipantId) {
      sharedKpiParticipantId
      participant {
        fullName
      }
    }
  }
`;
