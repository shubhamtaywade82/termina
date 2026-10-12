import { defineConfig } from 'vitepress';

// termina documentation site. It covers the two workspace packages: @fork/core (the renderer, a fork of Ink 8) and @fork/ui (the component kit, a fork of ink-ui 2).
export default defineConfig({
  title: 'termina',
  description: 'React terminal UI: a forked Ink renderer and a component kit',
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,

  // GitHub Pages serves the site at https://shubhamtaywade82.github.io/termina/
  base: '/termina/',

  head: [
    ['meta', { name: 'theme-color', content: '#f59e0b' }],
    ['meta', { property: 'og:title', content: 'termina' }],
    ['meta', { property: 'og:description', content: 'React terminal UI: a forked Ink renderer and a component kit.' }],
  ],

  themeConfig: {
    siteTitle: 'termina',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'UI Kit', link: '/ui/overview' },
      { text: 'API', link: '/api/core' },
      { text: 'Architecture', link: '/architecture/fork-provenance' },
      {
        text: 'GitHub',
        link: 'https://github.com/shubhamtaywade82/termina',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    ],

    sidebar: [
      {
        text: 'Guide',
        collapsed: false,
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Rendering', link: '/guide/rendering' },
          { text: 'Layout and Text', link: '/guide/layout-and-text' },
          { text: 'Keyboard and Focus', link: '/guide/keyboard-and-focus' },
          { text: 'Mouse', link: '/guide/mouse' },
          { text: 'Terminal Features', link: '/guide/terminal-features' },
          { text: 'Resize and Reflow', link: '/guide/resize' },
          { text: 'Alternate Screen and Suspend', link: '/guide/alternate-screen-and-suspend' },
          { text: 'Testing', link: '/guide/testing' },
        ],
      },
      {
        text: 'UI Kit',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/ui/overview' },
          { text: 'Theming', link: '/ui/theming' },
          { text: 'Spatial Focus Geometry', link: '/ui/spatial' },
          {
            text: 'Components',
            collapsed: false,
            items: [
              { text: 'Alert', link: '/ui/components/alert' },
              { text: 'Badge', link: '/ui/components/badge' },
              { text: 'ConfirmInput', link: '/ui/components/confirm-input' },
              { text: 'EmailInput', link: '/ui/components/email-input' },
              { text: 'LogStream', link: '/ui/components/log-stream' },
              { text: 'MultiSelect', link: '/ui/components/multi-select' },
              { text: 'OrderedList', link: '/ui/components/ordered-list' },
              { text: 'PasswordInput', link: '/ui/components/password-input' },
              { text: 'ProgressBar', link: '/ui/components/progress-bar' },
              { text: 'ScrollBox', link: '/ui/components/scroll-box' },
              { text: 'Select', link: '/ui/components/select' },
              { text: 'Spinner', link: '/ui/components/spinner' },
              { text: 'StatusMessage', link: '/ui/components/status-message' },
              { text: 'TextInput', link: '/ui/components/text-input' },
              { text: 'UnorderedList', link: '/ui/components/unordered-list' },
            ],
          },
        ],
      },
      {
        text: 'API Reference',
        collapsed: false,
        items: [
          { text: '@fork/core', link: '/api/core' },
          { text: '@fork/ui', link: '/api/ui' },
        ],
      },
      {
        text: 'Architecture',
        collapsed: false,
        items: [
          { text: 'Fork Provenance', link: '/architecture/fork-provenance' },
          { text: 'Ink Internals', link: '/architecture/ink-internals' },
          { text: 'Decisions', link: '/architecture/decisions' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/shubhamtaywade82/termina' }],

    search: { provider: 'local' },

    outline: { level: [2, 3], label: 'On this page' },

    docFooter: { prev: 'Previous', next: 'Next' },

    editLink: {
      pattern: 'https://github.com/shubhamtaywade82/termina/edit/main/docs-site/:path',
      text: 'Edit this page on GitHub',
    },

    lastUpdated: { text: 'Last updated' },
    darkModeSwitchLabel: 'Theme',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Back to top',
  },
});
