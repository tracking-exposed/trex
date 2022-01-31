const tsConfig = require('./tsconfig.json');
// jest.config.js
const { pathsToModuleNameMapper } = require('ts-jest');
const { jsWithTsESM } = require('ts-jest/presets');

const moduleNameMapper = pathsToModuleNameMapper(
  tsConfig.compilerOptions.paths,
  {
    prefix: '<rootDir>',
  }
);

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['./', '../packages/shared'],
  projects: ['./', '../packages/shared'],
  moduleNameMapper,
  globals: {
    'ts-jest': {
      // TS reports strange errors with jest,
      // that it doesn't report when running plain tsc...
      diagnostics: false,
      isolatedModules: true,
      useESM: true,
      project: './tsconfig.json',
    },
  },
  transform: {
    ...jsWithTsESM.transform,
    // '\\.js$': 'ts-jest',
  },
  // transformIgnorePatterns: [
  //   'node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
  // ],
  clearMocks: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['./jest.setup.js'],
  coverageProvider: 'v8',
  collectCoverageFrom: ['./bin/**', './lib/**', './routes/**', './parsers/**'],
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
