// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

// const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const lightCodeTheme = require('prism-react-renderer/themes/github');
const packageJson = require('../package.json');
const path = require('path');
// const { default: theme } = require('./theme');

const GITHUB_REPO = 'https://github.com/tracking-exposed/yttrex';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '@trex',
  tagline:
    'We develop tools to uncover how tracking and profiling have an impact on society',
  url: 'https://docs.tracking.exposed',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/yttrex128.png',
  organizationName: 'tracking-exposed', // Usually your GitHub org/user name.
  projectName: 'trex', // Usually your repo name.

  plugins: [
    // @tktrex
    // api
    [
      'docusaurus-plugin-openapi',
      {
        id: 'tktrex',
        path: '../platforms/tktrex/shared/build/open-api.json',
        routeBasePath: 'tktrex/api',
      },
    ],
    // docs
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'tk-docs',
        path: path.resolve(__dirname, '../platforms/tktrex/docs/docs'),
        routeBasePath: 'tktrex/docs',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // @yttrex
    // API
    [
      'docusaurus-plugin-openapi',
      {
        id: 'yttrex-api',
        path: '../platforms/yttrex/backend/build/open-api.json',
        routeBasePath: 'yttrex/api',
      },
    ],
    // docs
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'yttrex-docs',
        path: path.resolve(__dirname, '../platforms/yttrex/docs/docs'),
        routeBasePath: 'yttrex/docs',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],

    // tools
    // guardoni
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'guardoni-docs',
        path: path.resolve(__dirname, '../platforms/guardoni/docs'),
        routeBasePath: 'guardoni',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('docusaurus-preset-openapi').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/cloud-annotations/docusaurus-openapi/edit/main/demo/',
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
          alt: '@trex Logo',
          src: 'img/yttrex128.png',
        },
        items: [
          {
            type: 'doc',
            label: 'Guardoni',
            docId: 'guardoni-intro',
            docsPluginId: 'guardoni-docs'
          },
          {
            type: 'doc',
            docId: 'intro',
            docsPluginId: 'tk-docs',
            label: 'TikTok Scraper',
          },
          {
            type: 'doc',
            docId: 'yttrex-intro',
            docsPluginId: 'yttrex-docs',
            label: 'Youtube Scraper',
          },
          {
            type: 'dropdown',
            label: 'API',
            items: [
              { to: '/tktrex/api', label: '@tktrex' },
              { to: '/yttrex/api', label: '@yttrex' },
              { to: '/ycai/api', label: '@ycai' },
            ],
          },
          // { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://github.com/facebook/docusaurus',
            label: 'GitHub',
            position: 'right',
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
