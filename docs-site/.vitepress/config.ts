import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';

// termina documentation site. It covers the two workspace packages: @nemesis-oss/termina-core (the renderer, a fork of Ink 8) and @nemesis-oss/termina-ui (the component kit, a fork of ink-ui 2).

// Browser replacements for the Node built-ins that the termina renderer (a
// Node package) pulls in. The live previews in the UI kit pages bundle the
// real renderer and run it against an xterm.js terminal, so its `node:`
// imports are redirected to small inert shims and `terminal-size` (which
// shells out to `resize`) is stubbed. VitePress itself is unaffected: the
// aliases only apply to code that reaches these specifiers, which is only
// the preview bundle.
const shim = (name: string) =>
  fileURLToPath(new URL(`./theme/shims/${name}.ts`, import.meta.url));

const nodeAliases: Record<string, string> = {
  'node:process': shim('process'),
  'node:events': shim('events'),
  'node:stream': shim('stream'),
  'node:util': shim('util'),
  'node:fs': shim('fs'),
  'node:url': shim('url'),
  'node:path': shim('path'),
  'terminal-size': shim('terminal-size'),
  // One React for everyone. The workspace packages are installed as file:
  // symlinks and each resolves `react` through its own pnpm node_modules,
  // which gives the browser bundle several React copies — the demo components
  // then run their hooks against a copy whose dispatcher the termina
  // reconciler never installs ("Invalid hook call", empty frames). Pointing
  // the specifier at this project's copy makes every importer share it.
  // resolve.dedupe alone does not survive the npm-symlink → pnpm-store hop.
  // The `$` suffixes make the aliases exact: without them `react` also
  // rewrites `react/jsx-runtime` into `…/index.js/jsx-runtime`.
  'react$': fileURLToPath(
    new URL('../node_modules/react/index.js', import.meta.url),
  ),
  'react/jsx-runtime$': fileURLToPath(
    new URL('../node_modules/react/jsx-runtime.js', import.meta.url),
  ),
  'react/jsx-dev-runtime$': fileURLToPath(
    new URL('../node_modules/react/jsx-dev-runtime.js', import.meta.url),
  ),
};

export default defineConfig({
  title: 'termina',
  description: 'React terminal UI: a forked Ink renderer and a component kit',
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,

  // GitHub Pages serves the site at https://shubhamtaywade82.github.io/termina/
  base: '/termina/',

  vite: {
    resolve: {
      // The workspace packages are installed as file: symlinks; without
      // dedupe, their own node_modules would give the preview a second copy
      // of React and hooks would crash with "Invalid hook call".
      dedupe: ['react', 'react/jsx-runtime'],
      alias: nodeAliases,
    },
    build: {
      // yoga-layout (the layout engine termina uses) is an ES module with
      // top-level await; ES2022 is the first target that allows it.
      target: 'es2022',
    },
  },

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
          { text: 'Generative UI', link: '/guide/genui' },
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
              { text: 'Accordion', link: '/ui/components/accordion' },
              { text: 'Alert', link: '/ui/components/alert' },
              { text: 'Autocomplete', link: '/ui/components/autocomplete' },
              { text: 'Badge', link: '/ui/components/badge' },
              { text: 'CodeBlock', link: '/ui/components/code-block' },
              { text: 'ConfirmInput', link: '/ui/components/confirm-input' },
              { text: 'DataTable', link: '/ui/components/data-table' },
              { text: 'Dialog', link: '/ui/components/dialog' },
              { text: 'DiffView', link: '/ui/components/diff-view' },
              { text: 'Divider', link: '/ui/components/divider' },
              { text: 'EmailInput', link: '/ui/components/email-input' },
              { text: 'Gauge', link: '/ui/components/gauge' },
              { text: 'Header', link: '/ui/components/header' },
              { text: 'JSONViewer', link: '/ui/components/json-viewer' },
              { text: 'KeyHint', link: '/ui/components/key-hint' },
              { text: 'LoadingBar', link: '/ui/components/loading-bar' },
              { text: 'LogStream', link: '/ui/components/log-stream' },
              { text: 'Markdown', link: '/ui/components/markdown' },
              { text: 'MultiSelect', link: '/ui/components/multi-select' },
              { text: 'OrderedList', link: '/ui/components/ordered-list' },
              { text: 'PasswordInput', link: '/ui/components/password-input' },
              { text: 'ProgressBar', link: '/ui/components/progress-bar' },
              { text: 'ScrollBox', link: '/ui/components/scroll-box' },
              { text: 'Select', link: '/ui/components/select' },
              { text: 'Sparkline', link: '/ui/components/sparkline' },
              { text: 'Spinner', link: '/ui/components/spinner' },
              { text: 'StatusMessage', link: '/ui/components/status-message' },
              { text: 'Stepper', link: '/ui/components/stepper' },
              { text: 'StreamingText', link: '/ui/components/streaming-text' },
              { text: 'Table', link: '/ui/components/table' },
              { text: 'Tabs', link: '/ui/components/tabs' },
              { text: 'TextInput', link: '/ui/components/text-input' },
              { text: 'Toast', link: '/ui/components/toast' },
              { text: 'TokenCounter', link: '/ui/components/token-counter' },
              { text: 'TreeView', link: '/ui/components/tree-view' },
              { text: 'Typewriter', link: '/ui/components/typewriter' },
              { text: 'UnorderedList', link: '/ui/components/unordered-list' },
            ],
          },
        ],
      },
      {
        text: 'API Reference',
        collapsed: false,
        items: [
          { text: '@nemesis-oss/termina-core', link: '/api/core' },
          { text: '@nemesis-oss/termina-ui', link: '/api/ui' },
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
