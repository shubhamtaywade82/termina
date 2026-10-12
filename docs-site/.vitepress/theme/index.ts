// The default VitePress theme with a terminal-amber accent. Dark mode is
// handled by the default theme.
//
// Two preview systems are registered globally:
//
// - TerminalPreview shows pre-rendered frames (generated from renderToString
//   into .vitepress/generated/previews.json) on the guide and architecture
//   pages.
// - TerminalDemo is the live preview card used across the UI kit pages: it
//   runs real termina components on the actual renderer inside an xterm.js
//   terminal. The browser globals the renderer's Node dependencies expect are
//   installed here, before any preview can dynamically import the renderer.
import DefaultTheme from 'vitepress/theme';
import type {Theme} from 'vitepress';
import TerminalPreview from './TerminalPreview.vue';
import './shims/globals';
import TerminalDemo from './components/TerminalDemo.vue';
import './styles.css';

export default {
  extends: DefaultTheme,
  enhanceApp({app}) {
    app.component('TerminalPreview', TerminalPreview);
    app.component('TerminalDemo', TerminalDemo);
  },
} satisfies Theme;
