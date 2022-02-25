// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const packageJson = require('./package.json');

const GITHUB_REPO = 'https://github.com/tracking-exposed/yttrex';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '@tktrex',
  tagline: 'Tiktok service from tracking.exposed',
  url: 'https://tiktok.tracking.exposed/',
  baseUrl: '/docs/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/yttrex128.png',
  organizationName: 'tracking-exposed', // Usually your GitHub org/user name.
  projectName: 'tktrex', // Usually your repo name.

  plugins: [
    // @tktrex open api
    [
      'docusaurus-plugin-openapi',
      {
        id: 'tktrex',
        path: '../shared/build/open-api.json',
        routeBasePath: 'tktrex/api',
      },
    ],
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('docusaurus-preset-openapi').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/tracking-exposed/yttrex/edit/master/services/tktrex/docs/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themes: ['docusaurus-theme-openapi'],
  themeConfig:
    /** @type {import('docusaurus-theme-openapi').ThemeConfig} */
    ({
      navbar: {
        title: `@tktrex v${packageJson.version}`,
        logo: {
          alt: '@tktrex Logo',
          src: '/img/yttrex128.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            label: 'Docs',
          },
          {
            label: 'API',
            to: '/docs/tktrex/api',
          },
          {
            href: GITHUB_REPO,
            className: 'header-github-link',
            position: 'right',
            'aria-label': '@tktrex repo',
          },
        ],
      },
      footer: {
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting started',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Slack',
                href: 'https://trackingexposed.slack.com/invite/trex-tk',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/trackingexposed',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Youchoose',
                to: 'https://youchoose.ai',
              },
              {
                label: '@trex/facebook',
                to: 'https://facebook.tracking.exposed',
              },
              {
                label: '@trex/youtube',
                to: 'https://youtube.tracking.exposed',
              },
              {
                label: '@trex/pornhub',
                to: 'https://pornhub.tracking.exposed',
              },
              {
                label: '@trex/amazon',
                to: 'https://amazon.tracking.exposed',
              },
              // no blog at the moment
              // {
              //   label: 'Blog',
              //   to: '/blog',
              // },
            ],
          },
          {
            title: 'Dev',
            items: [
              {
                html: `<a class="header-github-link" href="${GITHUB_REPO}" target="_blank" rel="noreferrer"></a>`,
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Tracking Exposed Team. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
