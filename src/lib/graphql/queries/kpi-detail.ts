import { gql } from "@apollo/client";

export const GET_KPI_ASSIGNMENT_BREAKDOWN = gql`
  query GetKpiAssignmentBreakdown(
    $kpiId: ID!
    $strategicPeriodId: ID
    $page: Int!
    $limit: Int!
  ) {
    employeeAssignments: kpiAssignmentsEmployee(
      kpiId: $kpiId
      strategicPeriodId: $strategicPeriodId
      page: $page
      limit: $limit
    ) {
      items {
        kpiAssignmentEmployeeId
        targetValue
        weight
        parentWeightAllocation
        cap
        createdAt
        employee {
          employeeId
          fullName
          email
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
      }
    }
    departmentAssignments: kpiAssignmentsDepartment(
      kpiId: $kpiId
      strategicPeriodId: $strategicPeriodId
      page: $page
      limit: $limit
    ) {
      items {
        kpiAssignmentDepartmentId
        targetValue
        weight
        parentWeightAllocation
        cap
        createdAt
        department {
          departmentId
          name
          description
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
      }
    }
    divisionAssignments: kpiAssignmentsDivision(
      kpiId: $kpiId
      strategicPeriodId: $strategicPeriodId
      page: $page
      limit: $limit
    ) {
      items {
        kpiAssignmentDivisionId
        targetValue
        weight
        parentWeightAllocation
        cap
        createdAt
        division {
          divisionId
          name
          description
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
      }
    }
    corporateAssignments: kpiAssignmentsCorporate(
      kpiId: $kpiId
      strategicPeriodId: $strategicPeriodId
      page: $page
      limit: $limit
    ) {
      items {
        kpiAssignmentCorporateId
        targetValue
        weight
        cap
        createdAt
        organization {
          organizationId
          name
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
      }
    }
  }
`;
