const { pathsToModuleNameMapper } = require("ts-jest/utils");

const moduleNameMapper = pathsToModuleNameMapper(
  {
    "@shared/*": ["./shared/src/*"],
  },
  {
    prefix: "<rootDir>",
  }
);


/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["./", "./backend", "./YCAI"],
  projects: ["./backend", "./YCAI"],
  modulePathIgnorePatterns: ["__mocks__"],
  globals: {
    "ts-jest": {
      // TS reports strange errors with jest,
      // that it doesn't report when running plain tsc...
      diagnostics: false,
      isolatedModules: true,
    },
  },
  moduleNameMapper,
  clearMocks: true,
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  coveragePathIgnorePatterns: ["node_modules"],
};
