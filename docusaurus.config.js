// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'NEAR SDK docs',
  tagline: 'Write smart contracts to run on the NEAR blockchain!',
  url: 'https://near-sdk.io/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'NEAR',
  projectName: 'sdk-docs',
  themes: [
    '@saucelabs/theme-github-codeblock'
  ],
  themeConfig: ({
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    algolia: {
      appId: "0LUM67N2P2",
      apiKey: "129d0f429e1bb0510f0261dda1e88ed4",
      indexName: "near",
      contextualSearch: true,
      externalUrlRegex: "near\\.org|near-sdk\\.io",
      // Optional: Algolia search parameters
      searchParameters: {},
    },
    prism: {
      additionalLanguages: ['rust'],
    },
    colorMode: {
      defaultMode: 'dark',
    },
    navbar: {
      title: '',
      logo: {
        alt: 'NEAR logo',
        src: 'img/near_logo.svg',
        srcDark: 'img/near_logo_white.svg',
      },
      items: [
        {
          href: 'https://docs.rs/near-sdk/',
          label: 'docs.rs',
          position: 'right',
        },
        {
          href: 'https://github.com/near/near-sdk-rs',
          label: 'Rust SDK GitHub',
          position: 'right',
        },
        {
          href: 'https://github.com/near/sdk-docs',
          label: 'Docs GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/nearprotocol',
            },
            {
              label: 'Discord',
              href: 'https://discord.com/invite/UY9Xf2k',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/NEARProtocol',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'SDK GitHub',
              href: 'https://github.com/near/sdk-docs',
            },
          ],
        },
      ],
      copyright: `${new Date().getFullYear()} NEAR Protocol | All rights reserved | hello@near.org`,
    },
  }),
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/near/sdk-docs/edit/main/',
          routeBasePath: '/',
          "showLastUpdateAuthor": true,
          "showLastUpdateTime": true,
          "path": "./docs",
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
        gtag: {
          trackingID: 'G-NEHEBVDQKL',
          anonymizeIP: true,
        },
      }),
    ],
  ],
};

module.exports = config;
