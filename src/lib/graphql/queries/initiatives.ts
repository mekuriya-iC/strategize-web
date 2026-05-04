import { gql } from '@apollo/client';

/**
 * Initiative Queries
 * For managing strategic initiatives and their activities
 */

// Get paginated initiatives
export const GET_INITIATIVES = gql`
  query GetInitiatives(
    $page: Int!
    $limit: Int!
    $search: String
    $organizationId: ID
    $strategicObjectiveId: ID
    $status: InitiativeStatus
  ) {
    initiatives(
      page: $page
      limit: $limit
      search: $search
      organizationId: $organizationId
      strategicObjectiveId: $strategicObjectiveId
      status: $status
    ) {
      items {
        initiativeId
        title
        description
        status
        completionPercentage
        startDate
        dueDate
        isDeleted
        createdAt
        updatedAt
        owner {
          employeeId
          fullName
          email
          picture
        }
        createdBy {
          employeeId
          fullName
          email
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

// Get single initiative by ID
export const GET_INITIATIVE = gql`
  query GetInitiative($initiativeId: ID!) {
    initiative(initiativeId: $initiativeId) {
      initiativeId
      title
      description
      status
      completionPercentage
      startDate
      dueDate
      isDeleted
      createdAt
      updatedAt
      owner {
        employeeId
        fullName
        email
        picture
        title
      }
      createdBy {
        employeeId
        fullName
        email
      }
    }
  }
`;

// Get activities for an initiative
export const GET_ACTIVITIES = gql`
  query GetActivities(
    $page: Int!
    $limit: Int!
    $initiativeId: ID
    $organizationId: ID
    $search: String
  ) {
    activities(
      page: $page
      limit: $limit
      initiativeId: $initiativeId
      organizationId: $organizationId
      search: $search
    ) {
      items {
        activityId
        title
        description
        status
        milestone
        startDate
        dueDate
        notes
        isDeleted
        createdAt
        updatedAt
        initiative {
          initiativeId
          title
        }
        assignedTo {
          employeeId
          fullName
          email
          picture
        }
        createdBy {
          employeeId
          fullName
          email
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

// Get single activity by ID
export const GET_ACTIVITY = gql`
  query GetActivity($activityId: ID!) {
    activity(activityId: $activityId) {
      activityId
      title
      description
      status
      milestone
      startDate
      dueDate
      notes
      isDeleted
      createdAt
      updatedAt
      initiative {
        initiativeId
        title
      }
      assignedTo {
        employeeId
        fullName
        email
        picture
      }
      createdBy {
        employeeId
        fullName
        email
      }
    }
  }
`;
