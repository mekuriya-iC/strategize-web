import { gql } from '@apollo/client';

/**
 * System Configuration Mutations
 */
export const CREATE_SYSTEM_CONFIGURATION = gql`
  mutation CreateSystemConfiguration(
    $createSystemConfigurationInput: CreateSystemConfigurationInput!
  ) {
    createSystemConfiguration(
      createSystemConfigurationInput: $createSystemConfigurationInput
    ) {
      systemConfigurationId
      timezone
      fiscalYearStartMonth
      defaultRatingScaleMin
      defaultRatingScaleMax
      checkinDayOfWeek
      checkoutDayOfWeek
      enableEmailNotifications
      enableSharedKpis
      enableLogbookAttachments
      createdAt
    }
  }
`;

export const UPDATE_SYSTEM_CONFIGURATION = gql`
  mutation UpdateSystemConfiguration(
    $updateSystemConfigurationInput: UpdateSystemConfigurationInput!
  ) {
    updateSystemConfiguration(
      updateSystemConfigurationInput: $updateSystemConfigurationInput
    ) {
      systemConfigurationId
      timezone
      fiscalYearStartMonth
      defaultRatingScaleMin
      defaultRatingScaleMax
      checkinDayOfWeek
      checkoutDayOfWeek
      enableEmailNotifications
      enableSharedKpis
      enableLogbookAttachments
      updatedAt
    }
  }
`;

export const REMOVE_SYSTEM_CONFIGURATION = gql`
  mutation RemoveSystemConfiguration($systemConfigurationId: ID!) {
    removeSystemConfiguration(systemConfigurationId: $systemConfigurationId) {
      systemConfigurationId
    }
  }
`;
