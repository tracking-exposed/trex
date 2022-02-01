const jestBaseConfig = require('../jest.config.base');
const tsConfig = require('./tsconfig.json');
// jest.config.js
const { pathsToModuleNameMapper } = require('ts-jest');

const paths = pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
  prefix: '<rootDir>',
});

const moduleNameMapper = {
  ...paths,
  ...jestBaseConfig.moduleNameMapper,
};

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestBaseConfig,
  displayName: 'backend',
  moduleNameMapper,
  globals: {
    'ts-jest': {
      // TS reports strange errors with jest,
      // that it doesn't report when running plain tsc...
      diagnostics: false,
      isolatedModules: true,
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageProvider: 'v8',
  collectCoverageFrom: [
    '<rootDir>/bin/**',
    '<rootDir>/lib/**',
    '<rootDir>/routes/**',
    '<rootDir>/parsers/**',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
