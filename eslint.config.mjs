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
      "no-console": "off", // Allow console for extension logging
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
