import { ApolloClient } from "@apollo/client";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import { DELETE_OBJECTIVE } from "@/lib/graphql/mutations/objectives";
import { DELETE_KPI } from "@/lib/graphql/mutations/kpis";

/**
 * Cleanup utility to delete all objectives and KPIs
 * Used for data migration and testing purposes
 */
export async function cleanupObjectivesAndKPIs(
  client: ApolloClient<any>
): Promise<boolean> {
  try {
    console.log("🧹 Starting cleanup of objectives and KPIs...");

    // Fetch all KPIs first (delete children before parents)
    const { data: kpisData } = await client.query({
      query: GET_KPIS,
      variables: { page: 1, limit: 10000 },
      fetchPolicy: "network-only",
    });

    const kpis = kpisData?.kpis?.items || [];
    console.log(`Found ${kpis.length} KPIs to delete`);

    // Delete all KPIs
    let kpiDeleteCount = 0;
    for (const kpi of kpis) {
      try {
        await client.mutate({
          mutation: DELETE_KPI,
          variables: { input: { kpiId: kpi.kpiId } },
        });
        kpiDeleteCount++;
      } catch (error) {
        console.error(`Failed to delete KPI ${kpi.kpiId}:`, error);
      }
    }
    console.log(`✅ Deleted ${kpiDeleteCount}/${kpis.length} KPIs`);

    // Fetch all objectives
    const { data: objectivesData } = await client.query({
      query: GET_OBJECTIVES,
      variables: { page: 1, limit: 10000 },
      fetchPolicy: "network-only",
    });

    const objectives = objectivesData?.objectives?.items || [];
    console.log(`Found ${objectives.length} objectives to delete`);

    // Delete all objectives
    let objectiveDeleteCount = 0;
    for (const objective of objectives) {
      try {
        await client.mutate({
          mutation: DELETE_OBJECTIVE,
          variables: { input: { objectiveId: objective.objectiveId } },
        });
        objectiveDeleteCount++;
      } catch (error) {
        console.error(
          `Failed to delete objective ${objective.objectiveId}:`,
          error
        );
      }
    }
    console.log(
      `✅ Deleted ${objectiveDeleteCount}/${objectives.length} objectives`
    );

    // Clear Apollo cache
    await client.clearStore();
    console.log("✅ Apollo cache cleared");

    return (
      kpiDeleteCount === kpis.length &&
      objectiveDeleteCount === objectives.length
    );
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    return false;
  }
}
