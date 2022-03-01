const jestBaseConfig = require('./jest.config.base');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestBaseConfig,
  projects: [
    '<rootDir>/services/guardoni',
    '<rootDir>/services/ycai/studio',
    '<rootDir>/services/yttrex/backend',
  ],
};
