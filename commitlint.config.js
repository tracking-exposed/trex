module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // experiment with the max length a bit. tried 100, seems to be a little short.
    'header-max-length': [2, 'always', 144],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'feature',
        'fix',
        'bugfix',
        'hotfix',
        'perf',
        'docs',
        'refactor',
        'improvement',
        'chore',
        'revert',
        'ci',
        'style',
        'test',
        'release',
        'build',
      ],
    ],
  },
};
