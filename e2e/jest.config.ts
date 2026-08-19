import type { Config } from "jest";

/** Non-browser tests only — DSL and support unit tests. Browser specs run under Playwright. */
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/support", "<rootDir>/focus-flow"],
  testMatch: ["**/*.spec.ts"],
  testPathIgnorePatterns: ["\\.e2e\\.spec\\.ts$"],
};

export default config;
