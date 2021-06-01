/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'NEAR SDK docs',
  tagline: 'NEAR Rust SDK documentation',
  // TODO update site
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'NEAR',
  projectName: 'sdk-docs', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'NEAR SDK docs',
      logo: {
        alt: 'NEAR logo',
        src: 'img/near_logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Rust SDK',
        },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/near/sdk-docs',
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
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/near/sdk-docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/near/sdk-docs/edit/master/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/near/sdk-docs/edit/master/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
