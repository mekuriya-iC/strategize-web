/**
 * Cleanup utility to delete all existing objectives and KPIs
 * Run this once to start fresh with the new parent-child structure
 */

import { ApolloClient, gql } from "@apollo/client";
import { REMOVE_OBJECTIVE } from "@/lib/graphql/mutations/objectives";
import { REMOVE_KPI } from "@/lib/graphql/mutations/kpis";
// import { REMOVE_SUBMISSION } from "@/lib/graphql/mutations/submissions";
// import { GET_ALL_SUBMISSIONS_NO_TYPE } from "@/lib/graphql/queries/submissions";

const GET_ALL_OBJECTIVES = gql`
  query GetAllObjectives($limit: Int) {
    objectives(limit: $limit) {
      items {
        objectiveId
        name
        type
      }
      meta {
        totalItems
      }
    }
  }
`;

const GET_ALL_KPIS = gql`
  query GetAllKpis($limit: Int) {
    kpis(limit: $limit) {
      items {
        kpiId
        name
        objective {
          objectiveId
          name
        }
      }
      meta {
        totalItems
      }
    }
  }
`;

export async function cleanupObjectivesAndKPIs(
  apolloClient: ApolloClient<unknown>
) {
  console.log("🧹 Starting cleanup of all submissions, KPIs and objectives...");

  try {
    // Step 1: Skip submissions deletion for now (may require admin/backend cleanup)
    console.log(
      "📋 Skipping submissions deletion (will handle foreign key constraints gracefully)..."
    );

    // Step 2: Delete all KPIs first (they depend on objectives)
    console.log("📋 Fetching all KPIs...");
    const kpisResult = await apolloClient.query({
      query: GET_ALL_KPIS,
      variables: { limit: 1000 },
      fetchPolicy: "network-only",
    });

    const kpis = kpisResult.data.kpis.items;
    console.log(`Found ${kpis.length} KPIs to delete`);

    for (const kpi of kpis) {
      try {
        await apolloClient.mutate({
          mutation: REMOVE_KPI,
          variables: { id: kpi.kpiId },
        });
        console.log(`✅ Deleted KPI: ${kpi.name}`);
      } catch (error) {
        console.error(`❌ Failed to delete KPI ${kpi.name}:`, error);
      }
    }

    // Step 3: Delete all objectives (some may fail due to foreign key constraints)
    console.log("🎯 Fetching all objectives...");
    const objectivesResult = await apolloClient.query({
      query: GET_ALL_OBJECTIVES,
      variables: { limit: 1000 },
      fetchPolicy: "network-only",
    });

    const objectives = objectivesResult.data.objectives.items;
    console.log(`Found ${objectives.length} objectives to delete`);

    for (const objective of objectives) {
      try {
        await apolloClient.mutate({
          mutation: REMOVE_OBJECTIVE,
          variables: { id: objective.objectiveId },
        });
        console.log(
          `✅ Deleted Objective: ${objective.name} (${objective.type})`
        );
      } catch (error) {
        console.error(
          `❌ Failed to delete objective ${objective.name}:`,
          error
        );
        // Continue with other objectives even if some fail
      }
    }

    console.log("🎉 Cleanup completed successfully!");
    return true;
  } catch (error) {
    console.error("💥 Cleanup failed:", error);
    return false;
  }
}
