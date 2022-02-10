const tsJestPresets = require('ts-jest/presets');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...tsJestPresets.jsWithTsESM,
  preset: 'ts-jest',
  verbose: true,
  testEnvironment: 'node',
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
  moduleNameMapper: {
    '^@trex/shared/(.*)$': '<rootDir>/../packages/shared/src/$1',
    '^@trex/taboule/(.*)$': '<rootDir>/../packages/taboule/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test|e2e).[tj]s?(x)',
  ],
  moduleDirectories: ['node_modules'],
  modulePathIgnorePatterns: ['__mocks__'],
  clearMocks: true,
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  coveragePathIgnorePatterns: ['node_modules'],
};
