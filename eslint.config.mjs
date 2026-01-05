import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";

export default [
  // JavaScript and JSX files
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      react
    },
    settings: {
      react: {
        pragma: "h",  // Preact uses h pragma (or automatic with new JSX transform)
        version: "detect"
      }
    },
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
      "no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "no-undef": "error",  // Catch undefined variables including missing JSX imports
      "react/jsx-uses-react": "error",  // Prevent React/Preact being marked as unused
      "react/jsx-uses-vars": "error",   // Prevent variables used in JSX being marked as unused
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

      // Anti-patterns we want to catch
      "no-restricted-globals": ["error", {
        "name": "setInterval",
        "message": "Avoid setInterval - use MutationObserver, event listeners, or reactive patterns instead. See CONTRIBUTING.md for alternatives."
      }],
      "no-restricted-syntax": [
        "error",
        {
          "selector": "CallExpression[callee.name='setInterval']",
          "message": "Avoid setInterval - use MutationObserver, event listeners, or reactive patterns instead. See CONTRIBUTING.md for alternatives."
        },
        {
          "selector": "AssignmentExpression[left.object.name='window'][left.property.name=/^__keno_/]",
          "message": "Avoid window globals - use proper imports and exports. Only content.js message listeners should set window.__keno_* globals."
        },
        {
          "selector": "MemberExpression[object.name='window'][property.name=/^__keno_/]",
          "message": "Avoid window globals - import functions directly from their modules instead."
        }
      ],

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
      "*.bundle.js.map",
      "archived/**"  // Ignore archived legacy code
    ]
  },

  // Exemptions for specific files with legitimate uses
  {
    files: [
      "src/games/keno/content.js",                          // Message listener needs window.__keno_state
      "src/games/keno/bridges/windowGlobals.js",            // Intentional bridge for cross-context communication
      "src/games/keno/ui/previewHighlight.js",              // Bridge module
      "src/games/keno/ui/overlayInit.js",                   // Needs window globals for button handlers
      "src/games/keno/ui/numberSelection.js",               // Exports to window for content.js
      "src/shared/utils/dom/heatmap.js",                   // Exports to window for event handlers
      "src/shared/storage/patterns.js",                    // Cache clearing function
      "src/shared/storage/history.js",                     // Callback functions use window globals
      "src/shared/storage/profitLoss.js",                  // Updates use window globals temporarily
      "src/shared/storage/settings.js",                    // Settings updates use window globals
      "src/games/keno/generators/momentumCore.js",          // Debug function export
      "src/games/keno/generators/shapesCore.js",            // Debug function export
      "src/games/keno/hooks/useModals.js",                  // Modal manager uses window bridge
      "src/games/keno/ui/components/generator/AutoRefreshControl.jsx"  // Intentional setInterval for countdown
    ],
    rules: {
      "no-restricted-syntax": "off",             // Allow window globals in these files
      "no-restricted-globals": "off"             // Allow setInterval in AutoRefreshControl
    }
  }
];
