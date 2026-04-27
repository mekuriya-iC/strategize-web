#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Only run in development
if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  Skipping cleanup in production environment');
  process.exit(0);
}

const graphqlDir = path.join(process.cwd(), 'src/graphql');

function deleteDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      deleteDirectory(filePath);
      fs.rmdirSync(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }

  fs.rmdirSync(dir);
}

console.log('🧹 Cleaning up old GraphQL files...');

try {
  deleteDirectory(graphqlDir);
  console.log('✅ Old GraphQL files cleaned');
} catch (error) {
  console.error('❌ Error cleaning GraphQL files:', error.message);
  process.exit(1);
}
