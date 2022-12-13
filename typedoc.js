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
    './platforms/yttrex/shared',
  ],
  exclude: ['**/*+(index|.spec|.e2e).ts', '**/build/**', '**/node_modules/**'],
  // excludeNotDocumented: true,
  externalPattern: ['packages/shared/build/**'],
  excludeInternal: true,
  excludeExternals: true,
  out: 'build/docs',
  theme: 'my-theme',
  logLevel: 'Verbose',
};
