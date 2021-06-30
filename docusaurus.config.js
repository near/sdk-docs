/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'NEAR SDK docs',
  tagline: 'Write smart contracts to run on the NEAR blockchain!',
  // TODO update to custom domain in future
  url: 'https://sdk-g4yv.onrender.com/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'NEAR',
  projectName: 'sdk-docs',
  themeConfig: {
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
        // {
        //   type: 'doc',
        //   docId: 'intro',
        //   position: 'left',
        //   label: 'Rust SDK',
        // },
        // { to: '/blog', label: 'Blog', position: 'left' },
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
        // {
        //   title: 'Docs',
        //   items: [
        //     {
        //       label: 'Tutorial',
        //       to: '/docs/intro',
        //     },
        //   ],
        // },
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
            // {
            //   label: 'Blog',
            //   to: '/blog',
            // },
            {
              label: 'SDK GitHub',
              href: 'https://github.com/near/sdk-docs',
            },
          ],
        },
      ],
      copyright: `${new Date().getFullYear()} NEAR Protocol | All rights reserved | hello@near.org`,
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
        // blog: {
        //   showReadingTime: true,
        //   // Please change this to your repo.
        //   editUrl:
        //     'https://github.com/near/sdk-docs/edit/master/blog/',
        // },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
