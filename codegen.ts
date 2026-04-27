import type { CodegenConfig } from "@graphql-codegen/cli";
import * as fs from "fs";

// Determine schema source based on environment
const getSchemaSource = () => {
  // Priority: schema.graphql > graphql.schema.json > API endpoint
  if (fs.existsSync("./schema.graphql")) {
    console.log("📄 Using local schema.graphql");
    return "./schema.graphql";
  }

  if (fs.existsSync("./graphql.schema.json")) {
    console.log("📄 Using local graphql.schema.json");
    return "./graphql.schema.json";
  }

  // Last resort: use API endpoint directly
  const nodeEnv = process.env.NODE_ENV || "development";
  const apiUrl =
    nodeEnv === "production"
      ? process.env.NEXT_PUBLIC_API
      : process.env.GRAPHQL_SCHEMA_URL || "http://localhost:3000/graphql";

  console.warn(`⚠️  No local schema found. Using API endpoint: ${apiUrl}`);
  return apiUrl;
};

const config: CodegenConfig = {
  overwrite: true,
  schema: getSchemaSource(),
  documents: ["src/graphql/**/*.ts", "!src/graphql/fragments/**/*.ts"],
  generates: {
    "./src/gql/": {
      preset: "client",
      plugins: [],
      config: {
        skipTypename: true,
      },
    },
    "./graphql.schema.json": {
      plugins: ["introspection"],
    },
  },
  ignoreNoDocuments: true,
};

export default config;
