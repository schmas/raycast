import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/parse-*.ts"],
      thresholds: {
        lines: 99.9,
        functions: 99.9,
        branches: 99.9,
        statements: 99.9,
      },
    },
  },
});
