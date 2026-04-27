#!/usr/bin/env node

/**
 * Generate organized GraphQL structure from schema
 * Creates separate query and mutation files for each entity
 * 
 * Structure:
 * src/graphql/
 *   queries/
 *     objectives.ts
 *     kpis.ts
 *     submissions.ts
 *   mutations/
 *     objectives.ts
 *     kpis.ts
 *     submissions.ts
 *   fragments/
 *     -objectives.ts
 *     -kpis.ts
 *     -submissions.ts
 */

const fs = require('fs');
const path = require('path');

const GRAPHQL_DIR = path.join(process.cwd(), 'src/graphql');
const QUERIES_DIR = path.join(GRAPHQL_DIR, 'queries');
const MUTATIONS_DIR = path.join(GRAPHQL_DIR, 'mutations');
const FRAGMENTS_DIR = path.join(GRAPHQL_DIR, 'fragments');

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Entity definitions - map entity names to their GraphQL types
const ENTITIES = {
  objectives: {
    queryName: 'objectives',
    mutationNames: ['createObjective', 'updateObjective', 'removeObjective'],
    idField: 'objectiveId',
    fields: ['objectiveId', 'title', 'description', 'type', 'status', 'startDate', 'endDate'],
  },
  kpis: {
    queryName: 'kpis',
    mutationNames: ['createKpi', 'updateKpi', 'removeKpi'],
    idField: 'kpiId',
    fields: ['kpiId', 'name', 'description', 'target', 'current', 'unit'],
  },
  submissions: {
    queryName: 'submissions',
    mutationNames: ['createSubmission', 'updateSubmission', 'removeSubmission'],
    idField: 'submissionId',
    fields: ['submissionId', 'type', 'status', 'submittedAt', 'submittedBy'],
  },
  departments: {
    queryName: 'departments',
    mutationNames: ['createDepartment', 'updateDepartment', 'removeDepartment'],
    idField: 'departmentId',
    fields: ['departmentId', 'name', 'description', 'head'],
  },
  divisions: {
    queryName: 'divisions',
    mutationNames: ['createDivision', 'updateDivision', 'removeDivision'],
    idField: 'divisionId',
    fields: ['divisionId', 'name', 'description', 'department'],
  },
  employees: {
    queryName: 'employees',
    mutationNames: ['createEmployee', 'updateEmployee', 'removeEmployee'],
    idField: 'employeeId',
    fields: ['employeeId', 'name', 'email', 'department', 'division', 'role'],
  },
};

// Generate fragment file
function generateFragmentFile(entityName, entity) {
  const fragmentName = `${entityName.charAt(0).toUpperCase()}${entityName.slice(1)}Fragment`;
  const fields = entity.fields.join('\n    ');

  const content = `import { gql } from '@apollo/client';

/**
 * ${entityName.charAt(0).toUpperCase()}${entityName.slice(1)} fragment
 * Contains all common fields for ${entityName}
 */
export const ${fragmentName} = gql\`
  fragment ${fragmentName} on ${entityName.charAt(0).toUpperCase()}${entityName.slice(1)} {
    ${fields}
  }
\`;
`;

  return content;
}

// Generate query file
function generateQueryFile(entityName, entity) {
  const fragmentName = `${entityName.charAt(0).toUpperCase()}${entityName.slice(1)}Fragment`;
  const queryName = `Get${entityName.charAt(0).toUpperCase()}${entityName.slice(1)}`;
  const typeName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

  const content = `import { gql } from '@apollo/client';
import { ${fragmentName} } from '../fragments/-${entityName}';

/**
 * Query to fetch ${entityName}
 * Supports pagination and filtering
 */
export const ${queryName.toUpperCase()} = gql\`
  query ${queryName}($page: Int, $limit: Int, $filter: String) {
    ${entity.queryName}(page: $page, limit: $limit, filter: $filter) {
      items {
        ...${fragmentName}
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
  \${${fragmentName}}
\`;

/**
 * Query to fetch single ${entityName}
 */
export const GET_${entityName.toUpperCase()}_BY_ID = gql\`
  query Get${typeName}ById($id: ID!) {
    ${entityName.slice(0, -1)}(id: $id) {
      ...${fragmentName}
    }
  }
  \${${fragmentName}}
\`;
`;

  return content;
}

// Generate mutation file
function generateMutationFile(entityName, entity) {
  const fragmentName = `${entityName.charAt(0).toUpperCase()}${entityName.slice(1)}Fragment`;
  const typeName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

  let content = `import { gql } from '@apollo/client';
import { ${fragmentName} } from '../fragments/-${entityName}';

/**
 * Mutations for ${entityName}
 */

`;

  // Create mutation
  content += `export const CREATE_${entityName.toUpperCase()} = gql\`
  mutation Create${typeName}($input: Create${typeName}Input!) {
    create${typeName}(input: $input) {
      ...${fragmentName}
    }
  }
  \${${fragmentName}}
\`;

`;

  // Update mutation
  content += `export const UPDATE_${entityName.toUpperCase()} = gql\`
  mutation Update${typeName}($id: ID!, $input: Update${typeName}Input!) {
    update${typeName}(id: $id, input: $input) {
      ...${fragmentName}
    }
  }
  \${${fragmentName}}
\`;

`;

  // Delete mutation
  content += `export const DELETE_${entityName.toUpperCase()} = gql\`
  mutation Delete${typeName}($id: ID!) {
    delete${typeName}(id: $id) {
      success
      message
    }
  }
\`;
`;

  return content;
}

// Main function
async function main() {
  try {
    console.log('📁 Generating GraphQL structure...\n');

    ensureDir(QUERIES_DIR);
    ensureDir(MUTATIONS_DIR);
    ensureDir(FRAGMENTS_DIR);

    let fragmentCount = 0;
    let queryCount = 0;
    let mutationCount = 0;

    // Generate files for each entity
    for (const [entityName, entity] of Object.entries(ENTITIES)) {
      // Fragment file
      const fragmentContent = generateFragmentFile(entityName, entity);
      const fragmentPath = path.join(FRAGMENTS_DIR, `-${entityName}.ts`);
      fs.writeFileSync(fragmentPath, fragmentContent);
      fragmentCount++;
      console.log(`  ✅ Fragment: src/graphql/fragments/-${entityName}.ts`);

      // Query file
      const queryContent = generateQueryFile(entityName, entity);
      const queryPath = path.join(QUERIES_DIR, `${entityName}.ts`);
      fs.writeFileSync(queryPath, queryContent);
      queryCount++;
      console.log(`  ✅ Query: src/graphql/queries/${entityName}.ts`);

      // Mutation file
      const mutationContent = generateMutationFile(entityName, entity);
      const mutationPath = path.join(MUTATIONS_DIR, `${entityName}.ts`);
      fs.writeFileSync(mutationPath, mutationContent);
      mutationCount++;
      console.log(`  ✅ Mutation: src/graphql/mutations/${entityName}.ts`);
    }

    // Generate index files for easier imports
    const queryIndexContent = Object.keys(ENTITIES)
      .map(entity => `export * from './${entity}';`)
      .join('\n');
    fs.writeFileSync(path.join(QUERIES_DIR, 'index.ts'), queryIndexContent);

    const mutationIndexContent = Object.keys(ENTITIES)
      .map(entity => `export * from './${entity}';`)
      .join('\n');
    fs.writeFileSync(path.join(MUTATIONS_DIR, 'index.ts'), mutationIndexContent);

    const fragmentIndexContent = Object.keys(ENTITIES)
      .map(entity => `export * from '-${entity}';`)
      .join('\n');
    fs.writeFileSync(path.join(FRAGMENTS_DIR, 'index.ts'), fragmentIndexContent);

    console.log(`\n📊 Generated:`);
    console.log(`  📄 ${fragmentCount} fragment files`);
    console.log(`  📄 ${queryCount} query files`);
    console.log(`  📄 ${mutationCount} mutation files`);
    console.log(`  📄 3 index files\n`);
    console.log('✅ GraphQL structure generated successfully!');
  } catch (error) {
    console.error('❌ Error generating GraphQL structure:', error.message);
    process.exit(1);
  }
}

main();
