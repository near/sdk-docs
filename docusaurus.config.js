/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
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
  themeConfig: {
    algolia: {
      appId: "QPBQ67WNIG",
      apiKey: "b590ae1153bf574215ca1605c19eb1fe",
      indexName: "near",
      searchParameters: {
        // search only on near-sdk.io
        facetFilters: ["tags:sdk"]
      }
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
    gtag: {
      trackingID: 'G-NEHEBVDQKL',
      anonymizeIP: true,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/near/sdk-docs/edit/main/',
          routeBasePath: '/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
