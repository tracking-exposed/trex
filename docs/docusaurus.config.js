// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const path = require('path/posix');

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
    [
      'docusaurus-plugin-openapi',
      {
        id: 'tktrex',
        path: '../services/tktrex/shared/build/openapi-tktrex.json',
        routeBasePath: 'tktrex',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'guardoni-docs',
        path: path.resolve(__dirname, '../guardoni/docs'),
        routeBasePath: 'guardoni',
        sidebarPath: require.resolve('../guardoni/sidebars.js'),
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
            label: 'Docs',
            items: [
              {
                type: 'doc',
                docId: 'intro',
                label: 'Docs',
              },
              {
                type: 'doc',
                docId: 'intro',
                docsPluginId: 'guardoni-docs',
                label: 'Guardoni',
              },
            ],
          },
          { to: '/tktrex', label: 'API', position: 'left' },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://github.com/facebook/docusaurus',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
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
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
