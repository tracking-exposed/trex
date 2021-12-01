/* eslint-disable one-var */

const path = require('path');
const { readdirSync, statSync } = require('fs');

const tsConfig = require('./tsconfig.json');

const generateWebpackAliasesFromTSConfig = () => {
  const paths = tsConfig.compilerOptions.paths || {};
  const baseURL = tsConfig.compilerOptions.baseUrl || '.';

  const fromPaths = Object.keys(paths).reduce((aliases, key) => {
    const targets = paths[key];
    if (targets.length !== 1) {
      throw new Error(`Multiple aliases for ${key}`);
    }
    const alias = key.replace(/\/\*$/, '');
    const targetPath = path.resolve(__dirname, baseURL, targets[0]).replace(/\/\*$/, '');
    return {
      ...aliases,
      [alias]: targetPath,
    };
  }, {});

  const fromDirs = baseURL === '.'
    ? {}
    : readdirSync(path.resolve(__dirname, baseURL)).reduce(
        (aliases, dir) => {
          const target = path.resolve(__dirname, baseURL, dir);
          const stat = statSync(target);
          if (stat.isDirectory()) {
            return {
              ...aliases,
              [dir]: target,
            };
          }
          return aliases;
        },
        {}
      );

  return {...fromPaths, ...fromDirs};
};

module.exports = {
  generateWebpackAliasesFromTSConfig,
};
