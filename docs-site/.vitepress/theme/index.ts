// The default VitePress theme with a terminal-amber accent. Dark mode is handled by the default theme.
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import './styles.css';

export default {
  extends: DefaultTheme,
} satisfies Theme;
