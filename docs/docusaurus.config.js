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
  onBrokenLinks: 'warn',
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
        sidebarPath: require.resolve(
          path.resolve(__dirname, '../platforms/guardoni/docs/sidebars.js')
        ),
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'docs-guardoni-api',
        entryPoints: [
          '../platforms/guardoni/src/guardoni/cli.ts',
          '../platforms/guardoni/src/guardoni/guardoni.ts',
        ],
        tsconfig: '../platforms/guardoni/tsconfig.json',
        out: 'typedoc/guardoni',
        excludeInternal: true,
        watch: false,
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'shared-typedoc',
        entryPoints: ['../packages/shared/src/index.ts'],
        tsconfig: '../packages/shared/tsconfig.json',
        out: 'typedoc/shared',
        watch: false,
        sidebar: {
          categoryLabel: '@trex/shared',
        },
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'taboule-typedoc',
        entryPoints: ['../packages/taboule/src/index.tsx'],
        tsconfig: '../packages/taboule/tsconfig.json',
        out: 'typedoc/taboule',
        watch: false,
        sidebar: {
          categoryLabel: '@taboule',
        },
      },
    ],
    // typedoc for @tktrex
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'tk-shared-typedoc',
        entryPoints: ['../platforms/tktrex/shared/src/index.ts'],
        tsconfig: '../platforms/tktrex/shared/tsconfig.json',
        out: path.resolve(
          process.cwd(),
          '../platforms/tktrex/docs/docs/typedoc/shared'
        ),
        watch: false,
        sidebar: {
          categoryLabel: '@tktrex/shared',
        },
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'tk-ext-typedoc',
        entryPoints: [
          '../platforms/tktrex/extension/src/app/index.ts',
          '../platforms/tktrex/extension/src/background/index.ts',
        ],
        tsconfig: '../platforms/tktrex/extension/tsconfig.json',
        out: path.resolve(
          process.cwd(),
          '../platforms/tktrex/docs/docs/typedoc/extension'
        ),
        watch: process.env.TYPEDOC_WATCH,
        sidebar: {
          categoryLabel: '@tktrex/extension',
        },
      },
    ],

    [
      'docusaurus-plugin-typedoc',
      {
        id: 'tk-backend-typedoc',
        entryPoints: ['../platforms/tktrex/backend/bin/server.ts'],
        tsconfig: '../platforms/tktrex/backend/tsconfig.json',
        out: path.resolve(
          process.cwd(),
          '../platforms/tktrex/docs/docs/typedoc/backend'
        ),
        watch: process.env.TYPEDOC_WATCH,
        sidebar: {
          categoryLabel: '@tktrex/backend',
        },
      },
    ],
    // typedoc for @yttrex
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'yt-shared-typedoc',
        entryPoints: ['../platforms/yttrex/shared/src/index.ts'],
        tsconfig: '../platforms/yttrex/shared/tsconfig.json',
        out: path.resolve(
          process.cwd(),
          '../platforms/yttrex/docs/docs/typedoc/shared'
        ),
        watch: process.env.TYPEDOC_WATCH,
        sidebar: {
          categoryLabel: '@yttrex/shared',
        },
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'yt-ext-typedoc',
        entryPoints: [
          '../platforms/yttrex/extension/src/app/index.ts',
          '../platforms/yttrex/extension/src/background/index.ts',
        ],
        tsconfig: '../platforms/yttrex/extension/tsconfig.json',
        out: path.resolve(
          process.cwd(),
          '../platforms/yttrex/docs/docs/typedoc/extension'
        ),
        watch: process.env.TYPEDOC_WATCH,
        sidebar: {
          categoryLabel: '@yttrex/extension',
        },
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'yt-backend-typedoc',
        entryPoints: [
          '../platforms/yttrex/backend/bin/server.ts',
          '../platforms/yttrex/backend/bin/parser.ts',
        ],
        tsconfig: '../platforms/yttrex/backend/tsconfig.json',
        out: path.resolve(
          process.cwd(),
          '../platforms/yttrex/docs/docs/typedoc/backend'
        ),
        watch: process.env.TYPEDOC_WATCH,
        sidebar: {
          categoryLabel: '@yttrex/backend',
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
          breadcrumbs: false,
          // Please change this to your repo.
          editUrl: 'https://github.com/tracking-exposed/trex/',
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
            href: '/docs/typedoc/taboule',
            label: 'Taboule',
          },
          {
            href: '/docs/typedoc/shared',
            label: 'Shared',
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
          {
            type: 'dropdown',
            label: 'Source',
            position: 'right',
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
                to: '/tktrex/docs/typedoc/shared/',
                label: '@tktrex/shared',
              },
              {
                to: '/tktrex/docs/typedoc/extension/',
                label: '@tktrex/extension',
              },
              {
                to: '/tktrex/docs/typedoc/backend/',
                label: '@tktrex/backend',
              },
              {
                to: '/yttrex/docs/typedoc/shared/',
                label: '@yttrex/shared',
              },
              {
                to: '/yttrex/docs/typedoc/extension/',
                label: '@yttrex/extension',
              },
              {
                to: '/yttrex/docs/typedoc/backend/',
                label: '@yttrex/backend',
              },
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
