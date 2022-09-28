/* eslint-disable no-template-curly-in-string */

const conventionalCommitTypes = [
  // MINOR
  { type: 'feat', release: 'minor', section: 'Features' },
  { type: 'feature', release: 'minor', section: 'Features' },
  // PATCH
  { type: 'fix', release: 'patch', section: 'Fixes' },
  { type: 'refactor', release: 'patch', section: 'Fixes' },
  { type: 'chore', release: 'patch', section: 'Fixes' },
  { type: 'ci', release: 'patch', section: 'Fixes' },
  { type: 'test', release: 'patch', section: 'Fixes' },
  { type: 'bugfix', release: 'patch', section: 'Fixes' },
  { type: 'hotfix', release: 'patch', section: 'Fixes' },
  { type: 'perf', release: 'patch', section: 'Fixes' },
  { type: 'improvement', release: 'patch', section: 'Fixes' },
  { type: 'revert', release: 'patch', section: 'Fixes' },
  { type: 'style', release: 'patch', section: 'Fixes' },
  { type: 'docs', release: 'patch', section: 'Docs' },
  // NO RELEASE
  { type: 'ci', release: false },
  { type: 'build', release: false },
  { type: 'release', release: false },
  { scope: 'no-release', release: false },
];

module.exports = {
  hooks: {
    'after:init': [],
    'after:bump': [],
  },
  git: {
    requireUpstream: false,
    commitMessage: 'release: ${version} CHANGELOG [skip ci]',
  },
  github: {
    release: true,
    assets: [],
  },
  npm: false,
  plugins: {
    '@release-it/conventional-changelog': {
      infile: 'CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
        types: conventionalCommitTypes,
      },
      // not really useful until this PR is merged
      // https://github.com/conventional-changelog/conventional-changelog/pull/908
      // writerOpts: {
      //   groupBy: 'scope',
      // },
    },
    '@release-it-plugins/workspaces': {
      publish: false,
      skipChecks: true,
    },
    '@release-it/bumper': {
      out: 'VERSION',
    },
  },
};
