/* eslint-disable no-template-curly-in-string */

const conventionalCommitTypes = [
  // MINOR
  { type: 'feat', release: 'minor' },
  { type: 'feature', release: 'minor' },
  // PATCH
  { type: 'fix', release: 'patch' },
  { type: 'refactor', release: 'patch' },
  { type: 'chore', release: 'patch' },
  { type: 'ci', release: 'patch' },
  { type: 'test', release: 'patch' },
  { type: 'bugfix', release: 'patch' },
  { type: 'hotfix', release: 'patch' },
  { type: 'perf', release: 'patch' },
  { type: 'improvement', release: 'patch' },
  { type: 'revert', release: 'patch' },
  { type: 'style', release: 'patch' },
  { type: 'docs', release: 'patch' },
  // NO RELEASE
  { type: 'ci', release: false },
  { type: 'build', release: false },
  { type: 'release', release: false },
  { scope: 'no-release', release: false },
];

module.exports = {
  hooks: {
    'after:init': [],
    'after:bump': ['yarn release-it-after-bump'],
  },
  git: {
    requireUpstream: false,
    commitMessage: 'release: ${version} CHANGELOG [skip ci]',
    requireCleanWorkingDir: false,
  },
  github: {
    release: true,
    assets: [
      'extension/dist/*.zip',
      // ignore extension build for guardoni
      '!extension/dist/guardoni-*.zip',
      'guardoni/dist/*.deb',
      'guardoni/dist/*.exe',
      'guardoni/dist/*.dmg',
      'guardoni/dist/guardoni-cli-*',
      'services/tktrex/extension/dist/*.zip',
      'YCAI/build/extension/*.zip',
    ],
  },
  npm: false,
  plugins: {
    '@release-it/conventional-changelog': {
      infile: 'CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
        types: conventionalCommitTypes,
      },
    },
    'release-it-yarn-workspaces': {
      publish: false,
      skipChecks: true,
    },
  },
};
