import globals from "globals";
import js from "@eslint/js"; // Import recommended rules

export default [
  js.configs.recommended, // Start with recommended rules
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script", // Use 'script' because files are IIFEs/globals, not modules
      globals: {
        ...globals.browser, // Add all standard browser globals

        // KEEP ONLY THESE:
        "View": "readonly",
        "Controller": "readonly",

        // External Libraries / Other Globals
        "VirtualScroll": "readonly",
        "Papa": "readonly",
        "Mediator": "readonly" // Defined differently in main.js
      }
    },
    rules: {
      "indent": ["error", 4], // Keep enforcing 4-space indent
      "brace-style": ["error", "1tbs", { "allowSingleLine": true }], // Keep enforcing brace style
      "no-unused-vars": ["warn", {
        "vars": "all",
        "args": "after-used",
        "ignoreRestSiblings": false,
        "argsIgnorePattern": "^_", // Keep allowing unused args starting with _
      }],
      "no-prototype-builtins": "warn", // Keep warning for Object.prototype.hasOwnProperty
      "no-undef": "error", // Ensure undefined variables are errors
      "no-case-declarations": "error", // Ensure this rule is enabled
      "no-redeclare": "error" // Ensure this rule is enabled
    },
    ignores: [
        "node_modules/", // Standard practice to ignore node_modules
        "lib/virtual-scroll.js" // Example: ignore a specific library file if needed
    ]
  }
];