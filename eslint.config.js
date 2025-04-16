import globals from "globals";
import js from "@eslint/js";
import compatPlugin from "eslint-plugin-compat"; 

// Create explicit plugin object for flat config format
// Set to 'off' to remove compatibility warnings
const compat = {
  plugins: {
    compat: compatPlugin
  },
  rules: {
    "compat/compat": "off" // Change from 'warn' to 'off'
  }
};

export default [
  js.configs.recommended,
  compat,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        "Papa": "readonly",
        "Mediator": "readonly"
      }
    },
    rules: {
      // Critical errors
      "no-undef": "error",
      "no-duplicate-case": "error",
      "no-case-declarations": "error",
      
      // Warnings and style
      "eqeqeq": "warn",
      "no-console": "off",
      "no-prototype-builtins": "warn",
      "indent": ["warn", 2, { "SwitchCase": 1 }],
      "quotes": ["warn", "single", { "avoidEscape": true, "allowTemplateLiterals": true }],
      "semi": ["warn", "always"],
      "comma-dangle": ["warn", "never"],
      "brace-style": ["warn", "1tbs", { "allowSingleLine": true }],
      "max-len": ["warn", { "code": 130, "ignoreComments": true, "ignoreStrings": true, "ignoreTemplateLiterals": true }],
      
      "no-redeclare": "off",
      
      "no-unused-vars": ["warn", {
        "vars": "all",
        "args": "after-used",
        "ignoreRestSiblings": true,
        "argsIgnorePattern": "^(e|e1|e2|error|reject|resolve|element|value|observer|app|state|data|index|_|_Storage|_VirtualScroll)$",
        "varsIgnorePattern": "^(Component|Utils|CONSTANTS|Failsafe|Router|TemplateEngine|DataBinding|Storage|StorageManager|ASSETS_TO_CACHE|DataController|FilterModule|GalleryScroll)$"
      }]
    },
    settings: {
      compat: {
        browsers: [
          "last 2 versions", 
          "not ie <= 11",
          "not op_mini all",
          "not kaios <= 2.5"
        ],
        polyfills: [
          "Promise",
          "fetch",
          "IntersectionObserver",
          "performance.now"
        ]
      }
    },
    ignores: [
      "node_modules/",
      "lib/vendor/*.js",
      "lib/polyfills/*.js",
      "js/delete - *.js"
    ]
  },
  {
    files: ["**/debug/*.js", "**/*.dev.js", "**/*-debug.js"],
    rules: {
      "no-console": "off",
      "max-len": "off"
    }
  }
];