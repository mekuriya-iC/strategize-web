import { gql } from "@apollo/client";

export const GET_KPI_CONTRIBUTION_LINKS = gql`
  query GetKpiContributionLinks($page: Int, $limit: Int) {
    kpiContributionLinks(page: $page, limit: $limit) {
      items {
        kpiContributionLinkId
        relationship
        instruction
        expectedImpact
        supportingKpi {
          kpiId
          name
        }
        sourceKpi {
          kpiId
          name
          description
          targetValue
          weight
          measurementUnit
          unitType
        }
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
        itemCount
      }
    }
  }
`;
