import { gql } from '@apollo/client';

/**
 * System Configuration Queries
 */
export const GET_SYSTEM_CONFIGURATIONS = gql`
  query GetSystemConfigurations($page: Int!, $limit: Int!) {
    systemConfigurations(page: $page, limit: $limit) {
      items {
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
        updatedAt
        updatedBy {
          employeeId
          fullName
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

export const GET_SYSTEM_CONFIGURATION = gql`
  query GetSystemConfiguration($systemConfigurationId: ID!) {
    systemConfiguration(systemConfigurationId: $systemConfigurationId) {
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
      updatedAt
      updatedBy {
        employeeId
        fullName
        email
      }
    }
  }
`;

export const GET_SYSTEM_CONFIGURATION_BY_ORG = gql`
  query GetSystemConfigurationByOrg($organizationId: ID!) {
    systemConfigurationByOrg(organizationId: $organizationId) {
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
      updatedAt
      updatedBy {
        employeeId
        fullName
      }
    }
  }
`;
