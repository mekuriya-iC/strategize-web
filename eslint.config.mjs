import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-warning-comments": [
        "warn",
        { terms: ["todo", "fixme", "xxx", "hack"], location: "start" },
      ],
    },
  },
];

export default eslintConfig;
