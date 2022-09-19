const jestBaseConfig = require('../../jest.config.base');
const tsConfig = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

const tsPaths = pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
  prefix: '<rootDir>/src/',
});

const moduleNameMapper = {
  ...tsPaths,
  'boxen': "<rootDir>/__mocks__/boxen.mock.ts",
  'chalk': "<rootDir>/__mocks__/chalk.mock.ts"
};

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestBaseConfig,
  rootDir: __dirname,
  displayName: 'guardoni',
  moduleNameMapper,
  modulePathIgnorePatterns: [
    ...jestBaseConfig.modulePathIgnorePatterns,
    'profiles',
    'build',
  ],
  globals: {
    'ts-jest': {
      // TS reports strange errors with jest,
      // that it doesn't report when running plain tsc...
      diagnostics: true,
      isolatedModules: true,
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globalSetup: '<rootDir>/global-setup.js',
  globalTeardown: '<rootDir>/global-teardown.js',
  coverageProvider: 'v8',
  collectCoverageFrom: ['<rootDir>/src/**/*'],
  coveragePathIgnorePatterns: [
    'node_modules',
    'build',
    '<rootDir>/src/guardoni/tx-automate',
  ],
};
