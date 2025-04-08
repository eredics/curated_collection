import globals from "globals";

export default [
  {
    files: ["js/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        // Define all your custom globals
        "TemplateEngine": "readonly",
        "Component": "readonly",
        "Utils": "readonly",
        "CONSTANTS": "readonly",
        "Failsafe": "readonly",
        "Router": "readonly",
        "DataBinding": "readonly",
        "iOSHelpers": "readonly",
        "StorageManager": "readonly", // Add this line
        "Performance": "writable", // Override built-in Performance
        "Storage": "writable", // Override built-in Storage
      }
    },
    rules: {
      // Allow module access in IIFE exports
      "no-undef": "error",
      
      // Allow unused variables in specific cases
      "no-unused-vars": ["warn", {
        "varsIgnorePattern": "^(Component|Utils|CONSTANTS|Failsafe|Router|TemplateEngine|DataBinding|Storage|StorageManager|ASSETS_TO_CACHE)$",
        "argsIgnorePattern": "^(e|e1|e2|error|reject|resolve|element|value|observer|app|state|data)$",
        "caughtErrorsIgnorePattern": "^(e|e1|e2|error)$"
      }],
      
      // Allow empty catch blocks
      "no-empty": ["error", { "allowEmptyCatch": true }],
      
      // Allow overriding built-in globals
      "no-redeclare": ["error", { "builtinGlobals": false }],
      
      // Use safer hasOwnProperty calls
      "no-prototype-builtins": "warn",
      
      // Other style rules
      "brace-style": ["error", "1tbs"],
      "indent": ["error", 4]
    }
  }
];