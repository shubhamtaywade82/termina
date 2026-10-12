// The default VitePress theme with a terminal-amber accent. Dark mode is handled by the default theme. TerminalPreview is registered globally so any page can show a generated terminal frame.
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import TerminalPreview from './TerminalPreview.vue';
import './styles.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('TerminalPreview', TerminalPreview);
  },
} satisfies Theme;
