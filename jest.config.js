const jestBaseConfig = require('./jest.config.base');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestBaseConfig,
  projects: [
    '<rootDir>/packages/shared',
    '<rootDir>/platforms/guardoni',
    '<rootDir>/platforms/ycai/studio',
    '<rootDir>/platforms/yttrex/backend',
    '<rootDir>/platforms/yttrex/extension',
    '<rootDir>/platforms/tktrex/backend',
    '<rootDir>/platforms/tktrex/extension',
  ],
};
