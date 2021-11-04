const releaseRules = [
  { breaking: true, release: 'major' },
  { revert: true, release: 'patch' },
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
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        releaseRules,
      },
    ],
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    ['@semantic-release/exec', {
      prepareCmd: "npm run build -- ${nextRelease.version}"
    }],
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: 'build/extension.zip',
            label: 'Web Extension',
          },
        ],
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message: 'release: ${nextRelease.version} CHANGELOG [skip ci]',
      },
    ],
  ],
  branches: [
    {
      name: 'main',
      prerelease: false,
    },
    {
      name: 'beta',
      prerelease: true,
    },
  ],
  preset: 'conventionalcommits',
  presetConfig: {
    types: [
      { type: 'major', section: 'Breaking' },
      { type: 'breaking', section: 'Breaking' },
      { type: 'feat', section: 'Features' },
      { type: 'feature', section: 'Features' },
      { type: 'fix', section: 'Fixes' },
      { type: 'bugfix', section: 'Fixes' },
      { type: 'hotfix', section: 'Fixes' },
      { type: 'chore', section: 'Improvements' },
      { type: 'perf', section: 'Improvements' },
      { type: 'refactor', section: 'Improvements' },
      { type: 'improvement', section: 'Improvements' },
      { type: 'style', section: 'Improvements' },
      { type: 'docs', section: 'Docs' },

      { type: 'ci', section: 'Internals', hidden: true },
      { type: 'build', section: 'Internals', hidden: true },
      {
        type: 'release',
        section: 'Internals',
        hidden: true,
      },
    ],
  },
};
