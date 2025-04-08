import { defineConfig } from "eslint/config";import globals from "globals";import js from "@eslint/js";export default defineConfig([  { files: ["**/*.{js,mjs,cjs}"] },  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },]);module.exports = {  "env": {    "browser": true,    "es2021": true  },  "extends": "eslint:recommended",  "parserOptions": {    "ecmaVersion": "latest",    "sourceType": "script"  },  "globals": {    // Add your global variables here    "Component": "readonly",    "TemplateEngine": "readonly",    "Utils": "readonly",    "CONSTANTS": "readonly",    "Failsafe": "readonly",    "Router": "readonly"
  },
  "rules": {
    // Prevent duplicate keys in object literals
    "no-dupe-keys": "error",
    
    // Enforce consistent brace style
    "brace-style": ["error", "1tbs"],
    
    // Require trailing commas in multiline object literals
    "comma-dangle": ["error", "always-multiline"],
    
    // Enforce proper indentation
    "indent": ["error", 4],
    
    // Ensure proper IIFE format
    "wrap-iife": ["error", "inside"],
    
    // Relax unused vars for this project
    "no-unused-vars": ["warn", { 
      "varsIgnorePattern": "Component|Utils|CONSTANTS|Failsafe|Router" 
    }]
  }
};