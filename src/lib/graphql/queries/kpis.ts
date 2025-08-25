import { gql } from "@apollo/client";

export const GET_KPIS = gql`
  query GetKpis($page: Int, $limit: Int, $search: String) {
    kpis(page: $page, limit: $limit, search: $search) {
      items {
        kpiId
        name
        baseline
        weight
        unitType
        status
        targetStatus
        targets {
          timeline
          target
        }
        parent {
          kpiId
          name
        }
        objective {
          objectiveId
          name
          type
          status
        }
        createdAt
        updatedAt
      }
      meta {
        currentPage
        itemCount
        itemsPerPage
        totalItems
        totalPages
      }
    }
  }
`;

export const GET_KPI = gql`
  query GetKpi($kpiId: ID!) {
    kpi(kpiId: $kpiId) {
      kpiId
      name
      baseline
      weight
      unitType
      status
      targetStatus
      targets {
        timeline
        target
      }
      parent {
        kpiId
        name
      }
      objective {
        objectiveId
        name
        type
        status
      }
      createdAt
      updatedAt
    }
  }
`;
