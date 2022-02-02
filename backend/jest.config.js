const jestBaseConfig = require('../jest.config.base');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestBaseConfig,
  displayName: 'backend',
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
