// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

// const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const lightCodeTheme = require('prism-react-renderer/themes/github');
const packageJson = require('../package.json');
const path = require('path');
// const { default: theme } = require('./theme');

const GITHUB_REPO = 'https://github.com/tracking-exposed/trex';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '@trex',
  tagline:
    'We develop tools to uncover how tracking and profiling have an impact on society',
  url: 'https://docs.tracking.exposed',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/trex128.png',
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
        id: 'tktrex-docs',
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
        path: '../platforms/yttrex/shared/build/open-api.json',
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
    // @ycai
    // API
    [
      'docusaurus-plugin-openapi',
      {
        id: 'ycai-api',
        path: '../platforms/ycai/studio/build/open-api.json',
        routeBasePath: 'ycai/api',
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
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'shared-typedoc',
        entryPoints: ['../packages/shared/src/index.ts'],
        tsconfig: '../packages/shared/tsconfig.json',
        out: 'typedoc/shared',
        watch: process.env.TYPEDOC_WATCH,
        sidebar: {
          categoryLabel: '@trex/shared',
        },
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'taboule-typedoc',
        entryPoints: [
          '../packages/taboule/src/index.tsx',
          '../packages/taboule/src/state/index.ts',
          '../packages/taboule/src/config/index.tsx',
        ],
        tsconfig: '../packages/taboule/tsconfig.json',
        out: 'typedoc/taboule',
        watch: process.env.TYPEDOC_WATCH,
        sidebar: {
          categoryLabel: '@taboule',
        },
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'tk-shared-typedoc',
        entryPoints: ['../platforms/tktrex/shared/src/index.ts'],
        tsconfig: '../platforms/tktrex/shared/tsconfig.json',
        out: 'typedoc/tk/shared',
        watch: process.env.TYPEDOC_WATCH,
        sidebar: {
          categoryLabel: '@tktrex/shared',
        },
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'yt-shared-typedoc',
        entryPoints: ['../platforms/yttrex/shared/src/index.ts'],
        tsconfig: '../platforms/yttrex/shared/tsconfig.json',
        out: 'typedoc/yt/shared',
        watch: process.env.TYPEDOC_WATCH,
        sidebar: {
          categoryLabel: '@yttrex/shared',
        },
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
        // title: `@docs v${packageJson.version}`,
        logo: {
          alt: '@trex Logo',
          src: 'img/trexlogo_black.svg',
          srcDark: 'img/trexlogo.svg',
        },
        items: [
          {
            type: 'doc',
            label: 'Guardoni',
            docId: 'guardoni-intro',
            docsPluginId: 'guardoni-docs',
          },
          {
            type: 'doc',
            docId: 'tktrex-intro',
            docsPluginId: 'tktrex-docs',
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
            label: 'Source',
            items: [
              {
                to: 'docs/typedoc/shared',
                label: '@trex/shared',
              },
              {
                to: 'docs/typedoc/taboule',
                label: '@taboule',
              },
              {
                to: 'docs/typedoc/tk/shared',
                label: '@tktrex/shared',
              },
              {
                to: 'docs/typedoc/yt/shared',
                label: '@yttrex/shared',
              },
            ],
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
          {
            type: 'docsVersion',
            position: 'right',
            docsPluginId: 'guardoni-docs',
            label: `v${packageJson.version}`,
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
                href: 'https://join.slack.com/t/trackingexposed/shared_invite/zt-1c0gso7cx-T1OPAnhwItIOVJAtG9hpYA',
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
