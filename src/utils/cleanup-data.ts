/**
 * Data cleanup utility for development/testing
 * Safely deletes objectives, KPIs, and submissions
 * 
 * Usage:
 * import { cleanupAllData } from '@/utils/cleanup-data';
 * await cleanupAllData(apolloClient);
 */

import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { gql } from '@apollo/client';

// Queries
const GET_ALL_OBJECTIVES = gql`
  query GetAllObjectives($page: Int!, $limit: Int!) {
    objectives(page: $page, limit: $limit) {
      items {
        objectiveId
        title
        type
      }
      meta {
        totalItems
        totalPages
      }
    }
  }
`;

const GET_ALL_KPIS = gql`
  query GetAllKpis($page: Int!, $limit: Int!) {
    kpis(page: $page, limit: $limit) {
      items {
        kpiId
        name
        objective {
          objectiveId
          title
        }
      }
      meta {
        totalItems
        totalPages
      }
    }
  }
`;

const GET_ALL_SUBMISSIONS = gql`
  query GetAllSubmissions($page: Int!, $limit: Int!) {
    submissions(page: $page, limit: $limit) {
      items {
        submissionId
        type
        status
      }
      meta {
        totalItems
        totalPages
      }
    }
  }
`;

// Mutations
const REMOVE_OBJECTIVE = gql`
  mutation RemoveObjective($id: ID!) {
    removeObjective(id: $id) {
      success
      message
    }
  }
`;

const REMOVE_KPI = gql`
  mutation RemoveKpi($id: ID!) {
    removeKpi(id: $id) {
      success
      message
    }
  }
`;

const REMOVE_SUBMISSION = gql`
  mutation RemoveSubmission($id: ID!) {
    removeSubmission(id: $id) {
      success
      message
    }
  }
`;

// Types
interface CleanupOptions {
  deleteObjectives?: boolean;
  deleteKpis?: boolean;
  deleteSubmissions?: boolean;
  verbose?: boolean;
}

interface CleanupResult {
  success: boolean;
  deleted: {
    objectives: number;
    kpis: number;
    submissions: number;
  };
  errors: string[];
}

/**
 * Fetch all items with pagination
 */
async function fetchAllItems<T extends { [key: string]: any }>(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  query: any,
  itemsKey: string,
  verbose: boolean = false
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const result = await apolloClient.query({
        query,
        variables: { page, limit: 100 },
        fetchPolicy: 'network-only',
      });

      const items = result.data[itemsKey].items as T[];
      const meta = result.data[itemsKey].meta;

      allItems.push(...items);

      if (verbose) {
        console.log(`  📄 Fetched page ${page}: ${items.length} items`);
      }

      hasMore = page < meta.totalPages;
      page++;
    } catch (error) {
      console.error(`  ❌ Error fetching page ${page}:`, error);
      hasMore = false;
    }
  }

  return allItems;
}

/**
 * Delete items one by one with error handling
 */
async function deleteItems<T extends { [key: string]: any }>(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  items: T[],
  mutation: any,
  idKey: string,
  nameKey: string,
  verbose: boolean = false
): Promise<{ deleted: number; errors: string[] }> {
  let deleted = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      await apolloClient.mutate({
        mutation,
        variables: { id: item[idKey] },
      });

      deleted++;

      if (verbose) {
        console.log(`    ✅ Deleted: ${item[nameKey]}`);
      }
    } catch (error) {
      const errorMsg = `Failed to delete ${item[nameKey]}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);

      if (verbose) {
        console.log(`    ❌ ${errorMsg}`);
      }
    }
  }

  return { deleted, errors };
}

/**
 * Main cleanup function
 */
export async function cleanupAllData(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  options: CleanupOptions = {}
): Promise<CleanupResult> {
  const {
    deleteObjectives = true,
    deleteKpis = true,
    deleteSubmissions = true,
    verbose = true,
  } = options;

  const result: CleanupResult = {
    success: false,
    deleted: {
      objectives: 0,
      kpis: 0,
      submissions: 0,
    },
    errors: [],
  };

  try {
    if (verbose) {
      console.log('🧹 Starting data cleanup...\n');
    }

    // Step 1: Delete submissions first (they reference KPIs and objectives)
    if (deleteSubmissions) {
      if (verbose) {
        console.log('📋 Fetching submissions...');
      }

      const submissions = await fetchAllItems(
        apolloClient,
        GET_ALL_SUBMISSIONS,
        'submissions',
        verbose
      );

      if (verbose) {
        console.log(`  Found ${submissions.length} submissions\n`);
      }

      if (submissions.length > 0) {
        if (verbose) {
          console.log('🗑️  Deleting submissions...');
        }

        const { deleted, errors } = await deleteItems(
          apolloClient,
          submissions,
          REMOVE_SUBMISSION,
          'submissionId',
          'type',
          verbose
        );

        result.deleted.submissions = deleted;
        result.errors.push(...errors);

        if (verbose) {
          console.log(`  Deleted: ${deleted}/${submissions.length}\n`);
        }
      }
    }

    // Step 2: Delete KPIs (they reference objectives)
    if (deleteKpis) {
      if (verbose) {
        console.log('📋 Fetching KPIs...');
      }

      const kpis = await fetchAllItems(
        apolloClient,
        GET_ALL_KPIS,
        'kpis',
        verbose
      );

      if (verbose) {
        console.log(`  Found ${kpis.length} KPIs\n`);
      }

      if (kpis.length > 0) {
        if (verbose) {
          console.log('🗑️  Deleting KPIs...');
        }

        const { deleted, errors } = await deleteItems(
          apolloClient,
          kpis,
          REMOVE_KPI,
          'kpiId',
          'name',
          verbose
        );

        result.deleted.kpis = deleted;
        result.errors.push(...errors);

        if (verbose) {
          console.log(`  Deleted: ${deleted}/${kpis.length}\n`);
        }
      }
    }

    // Step 3: Delete objectives
    if (deleteObjectives) {
      if (verbose) {
        console.log('📋 Fetching objectives...');
      }

      const objectives = await fetchAllItems(
        apolloClient,
        GET_ALL_OBJECTIVES,
        'objectives',
        verbose
      );

      if (verbose) {
        console.log(`  Found ${objectives.length} objectives\n`);
      }

      if (objectives.length > 0) {
        if (verbose) {
          console.log('🗑️  Deleting objectives...');
        }

        const { deleted, errors } = await deleteItems(
          apolloClient,
          objectives,
          REMOVE_OBJECTIVE,
          'objectiveId',
          'title',
          verbose
        );

        result.deleted.objectives = deleted;
        result.errors.push(...errors);

        if (verbose) {
          console.log(`  Deleted: ${deleted}/${objectives.length}\n`);
        }
      }
    }

    result.success = result.errors.length === 0;

    if (verbose) {
      console.log('📊 Cleanup Summary:');
      console.log(`  ✅ Objectives deleted: ${result.deleted.objectives}`);
      console.log(`  ✅ KPIs deleted: ${result.deleted.kpis}`);
      console.log(`  ✅ Submissions deleted: ${result.deleted.submissions}`);

      if (result.errors.length > 0) {
        console.log(`  ⚠️  Errors: ${result.errors.length}`);
        result.errors.forEach(err => console.log(`    - ${err}`));
      }

      console.log(
        `\n${result.success ? '🎉 Cleanup completed successfully!' : '⚠️  Cleanup completed with errors'}`
      );
    }

    return result;
  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    result.success = false;
    result.errors.push(
      `Fatal error: ${error instanceof Error ? error.message : String(error)}`
    );
    return result;
  }
}

/**
 * Quick cleanup for development
 * Deletes everything
 */
export async function quickCleanup(
  apolloClient: ApolloClient<NormalizedCacheObject>
): Promise<boolean> {
  const result = await cleanupAllData(apolloClient, {
    deleteObjectives: true,
    deleteKpis: true,
    deleteSubmissions: true,
    verbose: true,
  });

  return result.success;
}

/**
 * Cleanup only objectives and KPIs (keep submissions)
 */
export async function cleanupObjectivesAndKpis(
  apolloClient: ApolloClient<NormalizedCacheObject>
): Promise<boolean> {
  const result = await cleanupAllData(apolloClient, {
    deleteObjectives: true,
    deleteKpis: true,
    deleteSubmissions: false,
    verbose: true,
  });

  return result.success;
}
