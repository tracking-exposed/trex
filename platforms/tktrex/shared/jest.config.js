const jestBaseConfig = require('../../../jest.config.base');
const tsConfig = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

const tsPaths = pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
  prefix: '<rootDir>/src/',
});

const moduleNameMapper = {
  ...tsPaths,
};

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestBaseConfig,
  moduleNameMapper,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__spec__/**/*.spec.ts'],
  setupFiles: ['./jest.setup.js'],
};
