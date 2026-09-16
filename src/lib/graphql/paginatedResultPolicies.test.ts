import { gql, InMemoryCache } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { paginatedResultPolicies } from "./paginatedResultPolicies";

describe.each([
  ["objectives", "PaginatedObjectives", "Objective", "objectiveId"],
  ["kpis", "PaginatedKpis", "Kpi", "kpiId"],
])("%s cache scope isolation", (field, wrapper, entity, idField) => {
  const query = gql(`query List($assigneeId: ID, $page: Int!, $search: String) {
    ${field}(assigneeId: $assigneeId, page: $page, search: $search) {
      items { ${idField} name }
      meta { totalItems currentPage }
    }
  }`);
  const createCache = () =>
    new InMemoryCache({
      typePolicies: {
        ...paginatedResultPolicies,
        [entity]: { keyFields: [idField] },
      },
    });
  const data = (ids: string[], count = ids.length, page = 1) => ({
    [field]: {
      __typename: wrapper,
      items: ids.map((id) => ({ __typename: entity, [idField]: id, name: id })),
      meta: {
        __typename: "PaginationMeta",
        totalItems: count,
        currentPage: page,
      },
    },
  });
  const read = (cache: InMemoryCache, variables: object) =>
    cache.readQuery<
      Record<
        string,
        { items: Record<string, string>[]; meta: { totalItems: number } }
      >
    >({ query, variables })![field];

  it("does not let the broad parent lookup overwrite an employee's list or counts", () => {
    const cache = createCache();
    const mine = { assigneeId: "employee-1", page: 1 };
    cache.writeQuery({
      query,
      variables: mine,
      data: data(["personal-1", "personal-2"]),
    });
    cache.writeQuery({
      query,
      variables: { page: 1 },
      data: data(["personal-1", "personal-2", "corporate-1", "corporate-2"]),
    });
    expect(read(cache, mine).items.map((item) => item[idField])).toEqual([
      "personal-1",
      "personal-2",
    ]);
    expect(read(cache, mine).meta.totalItems).toBe(2);
    expect(read(cache, { page: 1 }).items).toHaveLength(4);
  });

  it("keeps different employees, pages and searches independent in either arrival order", () => {
    const cache = createCache();
    const variables = [
      { page: 1 },
      { page: 2 },
      { page: 1, assigneeId: "employee-1" },
      { page: 1, assigneeId: "employee-2" },
      { page: 1, search: "pipeline" },
    ];
    for (const index of [4, 2, 0, 3, 1])
      cache.writeQuery({
        query,
        variables: variables[index],
        data: data([`record-${index}`], index + 1, variables[index].page),
      });
    variables.forEach((value, index) => {
      expect(read(cache, value).items[0][idField]).toBe(`record-${index}`);
      expect(read(cache, value).meta.totalItems).toBe(index + 1);
    });
  });

  it("still shares real entities so mutations update an item without replacing its list", () => {
    const cache = createCache();
    const mine = { assigneeId: "employee-1", page: 1 };
    cache.writeQuery({ query, variables: mine, data: data(["personal"]) });
    cache.writeQuery({
      query,
      variables: { page: 1 },
      data: data(["corporate", "personal"]),
    });
    cache.modify({
      id: cache.identify({ __typename: entity, [idField]: "personal" }),
      fields: { name: () => "Updated personal item" },
    });
    expect(read(cache, mine).items).toHaveLength(1);
    expect(read(cache, mine).items[0].name).toBe("Updated personal item");
    expect(read(cache, { page: 1 }).items[1].name).toBe(
      "Updated personal item",
    );
  });
});
