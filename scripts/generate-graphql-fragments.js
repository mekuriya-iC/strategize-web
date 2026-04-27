#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the schema
const schemaPath = path.join(process.cwd(), 'schema.graphql');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ schema.graphql not found. Run pnpm run schema:fetch first.');
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf-8');

// Create directories
const graphqlDir = path.join(process.cwd(), 'src/graphql');
const fragmentsDir = path.join(graphqlDir, 'fragments');

[graphqlDir, fragmentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Extract types from schema
const typeMatches = schema.matchAll(/^type (\w+) \{/gm);
const types = [];

for (const match of typeMatches) {
  const typeName = match[1];
  // Skip internal types
  if (!typeName.startsWith('Paginated') && 
      !typeName.startsWith('_') &&
      typeName !== 'Query' &&
      typeName !== 'Mutation' &&
      typeName !== 'Subscription') {
    types.push(typeName);
  }
}

console.log(`📋 Found ${types.length} types in schema`);

// Generate fragment files for each type
types.forEach(type => {
  const entityName = toKebabCase(type);
  
  // Generate fragment file
  const fragmentFile = path.join(fragmentsDir, `${entityName}.ts`);
  const fragmentContent = generateFragmentFile(type);
  fs.writeFileSync(fragmentFile, fragmentContent);
  console.log(`✅ Created: src/graphql/fragments/${entityName}.ts`);
});

// Generate index file
generateIndexFile(fragmentsDir, types);

console.log('\n✨ Fragment templates generated successfully!');
console.log(`📁 Created ${types.length} fragment files`);
console.log('\n📝 Next steps:');
console.log('1. Fill in the fragment files with actual fields from your schema');
console.log('2. Create query files in src/graphql/queries/');
console.log('3. Create mutation files in src/graphql/mutations/');
console.log('4. Run: pnpm run schema:generate');

// Helper functions
function toKebabCase(str) {
  return str
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function generateFragmentFile(type) {
  return `import { gql } from '@apollo/client';

export const ${type.toUpperCase()}_FRAGMENT = gql\`
  fragment ${type}Fields on ${type} {
    # TODO: Add fields from your schema
    # Example fields:
    # id
    # name
    # createdAt
    # updatedAt
  }
\`;
`;
}

function generateIndexFile(dir, types) {
  const imports = types
    .map(t => {
      const kebab = toKebabCase(t);
      const upper = t.toUpperCase();
      return `export { ${upper}_FRAGMENT } from './${kebab}';`;
    })
    .join('\n');

  const indexPath = path.join(dir, 'index.ts');
  fs.writeFileSync(indexPath, imports + '\n');
}
