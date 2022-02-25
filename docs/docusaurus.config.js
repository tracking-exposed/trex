// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

// const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const path = require('path/posix');
const { default: theme } = require('./theme');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '@trex',
  tagline: 'Dinosaurs are cool',
  url: 'https://docs.tracking.exposed',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/yttrex128.png',
  organizationName: 'tracking-exposed', // Usually your GitHub org/user name.
  projectName: 'trex', // Usually your repo name.

  plugins: [
    // @tktrex open api
    [
      'docusaurus-plugin-openapi',
      {
        id: 'tktrex',
        path: '../services/tktrex/shared/build/openapi-tktrex.json',
        routeBasePath: 'tktrex/api',
      },
    ],
    // @tktrex open api
    [
      'docusaurus-plugin-openapi',
      {
        id: 'ycai-api',
        path: '../YCAI/docs/openapi-validated.json',
        routeBasePath: 'ycai/api',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'guardoni-docs',
        path: path.resolve(__dirname, '../guardoni/docs'),
        routeBasePath: 'guardoni',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'ycai-docs',
        path: path.resolve(__dirname, '../YCAI/docs'),
        routeBasePath: 'ycai/docs',
        sidebarPath: require.resolve('../YCAI/sidebars.js'),
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
        title: '@trex',
        logo: {
          alt: '@trex Logo',
          src: 'img/yttrex128.png',
        },
        items: [
          {
            type: 'dropdown',
            label: 'Services',
            items: [
              {
                type: 'doc',
                docId: 'intro',
                docsPluginId: 'guardoni-docs',
                label: 'Guardoni',
              },
              {
                type: 'doc',
                docId: 'intro',
                docsPluginId: 'ycai-docs',
                label: 'YCAI',
              },
            ],
          },
          {
            type: 'dropdown',
            label: 'API',
            items: [
              { to: '/tktrex/api', label: '@tktrex' },
              { to: '/ycai/api', label: '@ycai' },
            ],
          },
          { to: '/blog', label: 'Blog', position: 'left' },
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
                label: 'Tutorial',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/docusaurus',
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/docusaurus',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/docusaurus',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/facebook/docusaurus',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Tracking Exposed Team. Built with Docusaurus.`,
      },
      prism: {
        theme: theme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
