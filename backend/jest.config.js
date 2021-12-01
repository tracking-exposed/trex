const tsConfig = require("./tsconfig.json");
// jest.config.js
const { pathsToModuleNameMapper } = require("ts-jest/utils");
const {jsWithTsESM, jsWithTs} = require('ts-jest/presets')

const moduleNameMapper = pathsToModuleNameMapper(
  tsConfig.compilerOptions.paths,
  {
    prefix: "<rootDir>",
  }
);

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  projects: ["./", "../shared"],
  moduleNameMapper,
  globals: {
    "ts-jest": {
      // TS reports strange errors with jest,
      // that it doesn't report when running plain tsc...
      diagnostics: false,
      isolatedModules: true,
    },
  },
  transform: jsWithTsESM.transform,
  clearMocks: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ["./jest.setup.js"],
};
