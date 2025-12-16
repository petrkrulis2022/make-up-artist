export default {
  testEnvironment: "node",
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: [
    "**/tests/**/*.test.js",
    "**/tests/**/*.property.test.js",
    "**/src/**/*.test.js",
  ],
  collectCoverageFrom: ["src/**/*.js", "!src/migrations/**"],
  coverageDirectory: "coverage",
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
