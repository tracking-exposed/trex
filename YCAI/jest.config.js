const { pathsToModuleNameMapper } = require('ts-jest/utils');
const tsConfig = require('./tsconfig.json');

const moduleNameMapper = pathsToModuleNameMapper(
  tsConfig.compilerOptions.paths, {
    prefix: '<rootDir>/src'
  }
);

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    ...moduleNameMapper,
    '\\.(svg|ttf)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
  },
  globals: {
    'ts-jest': {
      // TS reports strange errors with jest,
      // that it doesn't report when running plain tsc...
      diagnostics: false,
      isolatedModules: true,
    },
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};
