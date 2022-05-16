const { pathsToModuleNameMapper } = require('ts-jest');
const jestConfigBase = require('../../../jest.config.base');
const tsConfig = require('./tsconfig.json');

const tsPaths = pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
  prefix: '<rootDir>/src/',
});

const moduleNameMapper = {
  ...tsPaths,
  '\\.(svg|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
};

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestConfigBase,
  testEnvironment: 'jest-environment-jsdom-global',
  displayName: 'yt:ext',
  moduleNameMapper,
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
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  globalSetup: '<rootDir>/globalSetup.ts',
  globalTeardown: '<rootDir>/globalTeardown.ts',
  collectCoverageFrom: ['<rootDir>/src/*'],
};
