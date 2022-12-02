const jestBaseConfig = require('../../jest.config.base');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestBaseConfig,
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  displayName: '@shared',
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
  },
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
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  coverageProvider: 'v8',
  collectCoverageFrom: ['<rootDir>/src/**'],
  coveragePathIgnorePatterns: ['node_modules', 'build'],
};
