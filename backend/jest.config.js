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

console.log(moduleNameMapper);

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["./", "../", "../shared"],
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
  setupFilesAfterEnv: ["./jest.setup.js"],
};
