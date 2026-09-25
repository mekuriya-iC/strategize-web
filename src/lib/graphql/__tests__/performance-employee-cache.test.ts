import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gql, InMemoryCache } from "@apollo/client";
import { Kind, parse, print, visit, type FieldNode } from "graphql";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Read the real inline query documents without importing Next page components.
function employeeSelections(path: string): FieldNode[] {
  const source = ts.createSourceFile(
    path,
    readFileSync(resolve(process.cwd(), path), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fields: FieldNode[] = [];
  function inspect(node: ts.Node): void {
    if (
      ts.isTaggedTemplateExpression(node) &&
      node.tag.getText(source) === "gql" &&
      ts.isNoSubstitutionTemplateLiteral(node.template)
    ) {
      visit(parse(node.template.text), {
        Field(field) {
          if (field.name.value === "employee") fields.push(field);
        },
      });
    }
    ts.forEachChild(node, inspect);
  }
  inspect(source);
  return fields;
}

const createCache = () =>
  new InMemoryCache({
    typePolicies: { Employee: { keyFields: ["employeeId"] } },
  });

describe("performance employee cache identity", () => {
  it.each([
    "src/components/reports/UnifiedPerformanceReport.tsx",
    "src/app/dashboard/reports/page.tsx",
    "src/components/dashboard/AdvancedKPIDashboard.tsx",
  ])("all employee selections in %s include their cache key", (path) => {
    const fields = employeeSelections(path);
    expect(fields.length).toBeGreaterThan(0);
    for (const field of fields) {
      expect(
        field.selectionSet?.selections.some(
          (selection) =>
            selection.kind === Kind.FIELD &&
            selection.name.value === "employeeId",
        ),
      ).toBe(true);
      const query = gql(`query PerformanceEmployeeCache { ${print(field)} }`);
      const cache = createCache();
      expect(() =>
        cache.writeQuery({
          query,
          data: {
            employee: {
              __typename: "Employee",
              employeeId: "employee-1",
              fullName: "Test Employee",
              email: "test@example.com",
              title: "Director",
            },
          },
        }),
      ).not.toThrow();
      expect(
        cache.readQuery<{ employee: { employeeId: string } }>({ query })
          ?.employee.employeeId,
      ).toBe("employee-1");
      expect(cache.extract()).toHaveProperty(
        'Employee:{"employeeId":"employee-1"}',
      );
    }
  });

  it("reproduces the reported error when the nested ID is omitted", () => {
    const query = gql`
      query MissingEmployeeId {
        employee {
          fullName
        }
      }
    `;
    expect(() =>
      createCache().writeQuery({
        query,
        data: {
          employee: { __typename: "Employee", fullName: "Test Employee" },
        },
      }),
    ).toThrow();
  });
});
