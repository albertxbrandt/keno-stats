import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";

export default [
  // JavaScript files
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions
      }
    },
    rules: {
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

  // JSON files
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    ...json.configs.recommended
  },

  // Markdown files
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/commonmark",
    ...markdown.configs.recommended
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
