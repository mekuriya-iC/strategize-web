import { gql } from '@apollo/client';

const SYSTEM_CONFIGURATION_MUTATION_FIELDS = gql`
  fragment SystemConfigurationMutationFields on SystemConfiguration {
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
    enableFormulaKpis
    defaultKpiZeroDenominatorPolicy
    defaultKpiResultDirection
    defaultKpiTargetRangeOutsidePolicy
    createdAt
    updatedAt
  }
`;

export const CREATE_SYSTEM_CONFIGURATION = gql`
  ${SYSTEM_CONFIGURATION_MUTATION_FIELDS}
  mutation CreateSystemConfiguration(
    $createSystemConfigurationInput: CreateSystemConfigurationInput!
  ) {
    createSystemConfiguration(
      createSystemConfigurationInput: $createSystemConfigurationInput
    ) {
      ...SystemConfigurationMutationFields
    }
  }
`;

export const UPDATE_SYSTEM_CONFIGURATION = gql`
  ${SYSTEM_CONFIGURATION_MUTATION_FIELDS}
  mutation UpdateSystemConfiguration(
    $updateSystemConfigurationInput: UpdateSystemConfigurationInput!
  ) {
    updateSystemConfiguration(
      updateSystemConfigurationInput: $updateSystemConfigurationInput
    ) {
      ...SystemConfigurationMutationFields
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
