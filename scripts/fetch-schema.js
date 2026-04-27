#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Get API URL from environment or use default
const nodeEnv = process.env.NODE_ENV || "development";
let apiUrl = process.env.GRAPHQL_SCHEMA_URL;

if (!apiUrl) {
  if (nodeEnv === "production") {
    apiUrl = process.env.NEXT_PUBLIC_API;
  } else {
    apiUrl = "http://localhost:3000/graphql";
  }
}

console.log(`📡 Fetching schema from: ${apiUrl}`);
console.log(`🔧 Environment: ${nodeEnv}`);

// Introspection query
const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        ...FullType
      }
      directives {
        name
        description
        locations
        args {
          ...InputValue
        }
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

function fetchSchema(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const postData = JSON.stringify({
      query: introspectionQuery,
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 10000,
    };

    const req = protocol.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.errors) {
              reject(new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`));
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(
            new Error(
              `HTTP ${res.statusCode}: ${data.substring(0, 200)}`
            )
          );
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    // Check if API is reachable
    console.log("🔍 Checking API connectivity...");
    const schema = await fetchSchema(apiUrl);

    // Save introspection JSON
    const schemaPath = path.join(process.cwd(), "graphql.schema.json");
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
    console.log(`✅ Schema saved to: ${schemaPath}`);

    // Convert introspection to SDL (Schema Definition Language)
    const sdlPath = path.join(process.cwd(), "schema.graphql");
    const sdl = buildSchema(schema.data.__schema);
    fs.writeFileSync(sdlPath, sdl);
    console.log(`✅ SDL saved to: ${sdlPath}`);

    // Clean up old GraphQL files in development only
    if (nodeEnv !== "production") {
      console.log("\n🧹 Cleaning up old GraphQL files...");
      const { execSync } = require("child_process");
      try {
        execSync("node scripts/clean-graphql.js", { stdio: "inherit" });
      } catch (e) {
        console.warn("⚠️  Warning: Could not clean GraphQL files:", e.message);
      }
    } else {
      console.log("\n⏭️  Skipping cleanup (production environment)");
    }

    console.log("\n🚀 Running code generation...");
    const { execSync } = require("child_process");
    try {
      execSync("pnpm run schema:generate", { stdio: "inherit" });
      console.log("✅ Code generation completed successfully!");
    } catch (e) {
      console.error("❌ Code generation failed:", e.message);
      process.exit(1);
    }

    // Generate organized GraphQL structure in development
    if (nodeEnv !== "production") {
      console.log("\n📁 Generating organized GraphQL structure...");
      try {
        execSync("node scripts/generate-graphql-structure.js", { stdio: "inherit" });
      } catch (e) {
        console.warn("⚠️  Warning: Could not generate GraphQL structure:", e.message);
      }
    } else {
      console.log("⏭️  Skipping structure generation (production environment)");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\n📋 Troubleshooting:");
    console.error("1. Make sure your GraphQL API is running at:", apiUrl);
    console.error("2. Check your internet connection");
    console.error("3. Try setting the API URL manually:");
    console.error("   export GRAPHQL_SCHEMA_URL=http://your-api-url/graphql");
    console.error("   pnpm run schema:fetch");
    process.exit(1);
  }
}

// Introspection to SDL converter
function buildSchema(schema) {
  let sdl = "";
  const builtInTypes = ["String", "Int", "Float", "Boolean", "ID"];

  // First pass: collect all custom scalars and enums
  const customScalars = [];
  const enums = [];
  const inputs = [];
  const types = [];

  for (const type of schema.types) {
    if (type.name.startsWith("__")) continue;

    if (type.kind === "SCALAR" && !builtInTypes.includes(type.name)) {
      customScalars.push(type);
    } else if (type.kind === "ENUM") {
      enums.push(type);
    } else if (type.kind === "INPUT_OBJECT") {
      inputs.push(type);
    } else if (type.kind === "OBJECT" && !["Query", "Mutation", "Subscription"].includes(type.name)) {
      types.push(type);
    }
  }

  // Add custom scalars
  for (const scalar of customScalars) {
    sdl += `scalar ${scalar.name}\n`;
  }
  if (customScalars.length > 0) sdl += "\n";

  // Add enums
  for (const enumType of enums) {
    sdl += `enum ${enumType.name} {\n`;
    if (enumType.enumValues) {
      for (const value of enumType.enumValues) {
        sdl += `  ${value.name}\n`;
      }
    }
    sdl += `}\n\n`;
  }

  // Add input types
  for (const input of inputs) {
    sdl += `input ${input.name} {\n`;
    if (input.inputFields) {
      for (const field of input.inputFields) {
        const fieldType = formatType(field.type);
        sdl += `  ${field.name}: ${fieldType}\n`;
      }
    }
    sdl += `}\n\n`;
  }

  // Add object types
  for (const type of types) {
    sdl += `type ${type.name}`;
    if (type.interfaces && type.interfaces.length > 0) {
      sdl += ` implements ${type.interfaces.map((i) => i.name).join(", ")}`;
    }
    sdl += ` {\n`;
    if (type.fields) {
      for (const field of type.fields) {
        const fieldType = formatType(field.type);
        sdl += `  ${field.name}: ${fieldType}\n`;
      }
    }
    sdl += `}\n\n`;
  }

  // Add Query
  const queryType = schema.types.find((t) => t.name === "Query");
  if (queryType && queryType.fields && queryType.fields.length > 0) {
    sdl += `type Query {\n`;
    for (const field of queryType.fields) {
      const fieldType = formatType(field.type);
      const args = field.args && field.args.length > 0
        ? `(${field.args.map((arg) => `${arg.name}: ${formatType(arg.type)}`).join(", ")})`
        : "";
      sdl += `  ${field.name}${args}: ${fieldType}\n`;
    }
    sdl += `}\n\n`;
  }

  // Add Mutation
  const mutationType = schema.types.find((t) => t.name === "Mutation");
  if (mutationType && mutationType.fields && mutationType.fields.length > 0) {
    sdl += `type Mutation {\n`;
    for (const field of mutationType.fields) {
      const fieldType = formatType(field.type);
      const args = field.args && field.args.length > 0
        ? `(${field.args.map((arg) => `${arg.name}: ${formatType(arg.type)}`).join(", ")})`
        : "";
      sdl += `  ${field.name}${args}: ${fieldType}\n`;
    }
    sdl += `}\n`;
  }

  return sdl;
}

function formatType(type) {
  if (!type) return "String";
  
  if (type.kind === "NON_NULL") {
    return `${formatType(type.ofType)}!`;
  } else if (type.kind === "LIST") {
    return `[${formatType(type.ofType)}]`;
  } else {
    return type.name || "String";
  }
}

main();
