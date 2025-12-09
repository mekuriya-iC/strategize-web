import { createRequire } from "module";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);

// Use require.resolve to get the actual path, then convert to file:// URL for ESM import
const coreWebVitalsPath = require.resolve("eslint-config-next/core-web-vitals");
const typescriptPath = require.resolve("eslint-config-next/typescript");

const nextCoreWebVitals = await import(pathToFileURL(coreWebVitalsPath).href);
const nextTypescript = await import(pathToFileURL(typescriptPath).href);

// Handle both default and named exports
const coreWebVitalsConfig = nextCoreWebVitals.default || nextCoreWebVitals;
const typescriptConfig = nextTypescript.default || nextTypescript;

const eslintConfig = [
  ...(Array.isArray(coreWebVitalsConfig)
    ? coreWebVitalsConfig
    : [coreWebVitalsConfig]),
  ...(Array.isArray(typescriptConfig) ? typescriptConfig : [typescriptConfig]),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
