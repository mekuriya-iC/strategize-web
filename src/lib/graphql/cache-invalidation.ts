import type { ApolloCache, StoreObject } from "@apollo/client";

/** Evict every argument variant of the named ROOT_QUERY fields. */
export function evictRootFields(
  cache: ApolloCache<object>,
  fieldNames: readonly string[],
): void {
  for (const fieldName of new Set(fieldNames)) {
    cache.evict({ id: "ROOT_QUERY", fieldName });
  }
}

/** Remove list variants and the deleted normalized entity, then reclaim orphans. */
export function evictDeletedEntity(
  cache: ApolloCache<object>,
  fieldNames: readonly string[],
  entity: StoreObject,
): void {
  evictRootFields(cache, fieldNames);
  const id = cache.identify(entity);
  if (id) cache.evict({ id });
  cache.gc();
}
