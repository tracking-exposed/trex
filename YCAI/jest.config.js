const { generateWebpackAliasesFromTSConfig } = require('./webpackConfigUtils');

const aliases = generateWebpackAliasesFromTSConfig()

const moduleNameMapper = Object.keys(aliases).reduce((acc, alias) => ({
  ...acc,
  [`^${alias}/(.*)$`]: `${aliases[alias]}/$1`,
}), {
  '\\.(svg|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
});

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper,
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
