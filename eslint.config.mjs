import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";

export default [
  // JavaScript files
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": ["warn", {
        "allow": ["warn", "error"]
      }], // Allow console.warn for warnings and console.error for errors. Do NOT use console.warn for debugging.

      // Prevent common bugs
      "no-duplicate-imports": "error",
      "no-const-assign": "error",
      "no-unreachable": "error",
      "no-dupe-keys": "error",

      // Code consistency
      "prefer-const": "warn",
      "no-var": "error"
    }
  },

  // Ignore patterns
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "data/**",
      "*.bundle.js",
      "*.bundle.js.map"
    ]
  }
];
