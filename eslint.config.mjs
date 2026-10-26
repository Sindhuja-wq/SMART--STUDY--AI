import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const patchedNextVitals = nextVitals.map((config) => {
  if (config.rules && "react-hooks/set-state-in-effect" in config.rules) {
    return {
      ...config,
      rules: {
        ...config.rules,
        "react-hooks/set-state-in-effect": "warn",
      },
    };
  }
  return config;
});

const eslintConfig = defineConfig([
  ...patchedNextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".worktrees/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "SMART--STUDY--AI/**",
    "scripts/**",
    "scratch_test.js",
  ]),
]);

export default eslintConfig;
