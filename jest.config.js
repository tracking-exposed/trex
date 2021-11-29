/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      // TS reports strange errors with jest,
      // that it doesn't report when running plain tsc...
      diagnostics: false,
      isolatedModules: true,
    },
  },
  clearMocks: true,
};
