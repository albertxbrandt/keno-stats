import js from "@eslint/js";
import globals from "globals";

export default [
  // JavaScript and JSX files
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
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
      "no-var": "error",

      // Track TODOs and FIXMEs during refactoring
      "no-warning-comments": ["warn", {
        "terms": ["TODO", "FIXME", "XXX", "HACK", "REFACTOR"],
        "location": "start"
      }]
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
