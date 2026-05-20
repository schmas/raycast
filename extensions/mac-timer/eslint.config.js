const { defineConfig } = require("eslint/config");
const raycastConfig = require("@raycast/eslint-config");

module.exports = defineConfig([
  { ignores: ["raycast-env.d.ts"] },
  ...raycastConfig,
  {
    files: ["eslint.config.js", "vitest.config.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);
