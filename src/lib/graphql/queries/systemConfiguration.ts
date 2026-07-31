import { gql } from '@apollo/client';

const SYSTEM_CONFIGURATION_FIELDS = gql`
  fragment SystemConfigurationFields on SystemConfiguration {
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
    updatedBy {
      employeeId
      fullName
      email
    }
  }
`;

export const GET_SYSTEM_CONFIGURATIONS = gql`
  ${SYSTEM_CONFIGURATION_FIELDS}
  query GetSystemConfigurations($page: Int!, $limit: Int!) {
    systemConfigurations(page: $page, limit: $limit) {
      items {
        ...SystemConfigurationFields
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

export const GET_SYSTEM_CONFIGURATION = gql`
  ${SYSTEM_CONFIGURATION_FIELDS}
  query GetSystemConfiguration($systemConfigurationId: ID!) {
    systemConfiguration(systemConfigurationId: $systemConfigurationId) {
      ...SystemConfigurationFields
    }
  }
`;

export const GET_SYSTEM_CONFIGURATION_BY_ORG = gql`
  ${SYSTEM_CONFIGURATION_FIELDS}
  query GetSystemConfigurationByOrg($organizationId: ID!) {
    systemConfigurationByOrg(organizationId: $organizationId) {
      ...SystemConfigurationFields
    }
  }
`;
