const jestBaseConfig = require('./jest.config.base');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestBaseConfig,
  projects: [
    '<rootDir>/backend',
    '<rootDir>/guardoni',
    '<rootDir>/services/ycai/studio',
  ],
};
