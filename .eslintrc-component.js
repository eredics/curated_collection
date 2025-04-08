import globals from "globals";

export default [
  {
    files: ["js/component.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        "TemplateEngine": "readonly"
      }
    },
    rules: {
      // Disable the no-unused-vars rule specifically for this file
      "no-unused-vars": "off",
      // Other rules remain the same
      "no-dupe-keys": "error",
      "brace-style": ["error", "1tbs"],
      "indent": ["error", 4]
    }
  }
];