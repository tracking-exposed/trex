/**
 * @type {import('typedoc').TypeDocOptions}
 */
module.exports = {
  name: 'TRex',
  tsconfig: './tsconfig.docs.json',
  entryPointStrategy: 'packages',
  entryPoints: [
    './packages/shared',
    './packages/taboule',
    './platforms/tktrex/shared',
    './platforms/tktrex/extension',
    './platforms/tktrex/backend',
    './platforms/yttrex/shared',
    './platforms/yttrex/extension',
    './platforms/yttrex/backend',
  ],
  exclude: ['**/*+(index|.spec|.e2e).ts', '**/build/**', '**/node_modules/**'],
  // excludeNotDocumented: true,
  excludeInternal: true,
  excludeExternals: true,
  disableSources: true,
  skipErrorChecking: true,
  validation: {
    invalidLink: false,
    notDocumented: true,
    notExported: false,
  },
  out: 'build/docs',
  theme: 'my-theme',
  logLevel: 'Verbose',
};
