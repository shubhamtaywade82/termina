// Mounts a termina demo component into a live xterm.js terminal.
//
// This is the bridge that makes the docs previews *real*: the demo runs on the
// actual termina renderer (React reconciler + Yoga layout + the fork's reflow
// and synchronized-update output) and every frame it produces is written into
// xterm.js, a full terminal emulator. Keystrokes typed into the preview are
// delivered to `useInput`, and demos that enable mouse tracking receive wheel
// and click events, because xterm.js speaks the same SGR mouse protocol as a
// desktop terminal.
//
// Everything termina-related is imported dynamically so the (sizable) renderer
// bundle is only fetched on pages that actually show a preview, and VitePress
// server-side rendering never touches it.

import {FakeStderr, FakeStdin, FakeStdout} from './fake-tty';

export type DemoRenderOptions = {
  exitOnCtrlC?: boolean;
  alternateScreen?: boolean;
  mouse?: boolean;
};

export type MountDemoOptions = {
  /** Element the terminal should render into. Must already be in the DOM. */
  element: HTMLElement;
  /** The demo's React component. */
  component: React.ComponentType;
  /** Fixed viewport height in terminal rows. */
  rows: number;
  renderOptions?: DemoRenderOptions;
  /** Called when the mounted app exits or crashes (enables a Restart button). */
  onExit?: () => void;
  /** Called with true/false as the preview terminal gains or loses focus. */
  onFocusChange?: (focused: boolean) => void;
};

export type MountedDemo = {
  focus: () => void;
  dispose: () => void;
};

const terminalTheme = {
  background: '#0d1117',
  foreground: '#e6edf3',
  cursor: '#e6edf3',
  cursorAccent: '#0d1117',
  selectionBackground: '#58a6ff66',
  black: '#484f58',
  red: '#ff7b72',
  green: '#7ee787',
  yellow: '#e3b341',
  blue: '#79c0ff',
  magenta: '#d2a8ff',
  cyan: '#76e3ea',
  white: '#e6edf3',
  brightBlack: '#6e7681',
  brightRed: '#ffa198',
  brightGreen: '#aff5b4',
  brightYellow: '#f2cc60',
  brightBlue: '#a5d6ff',
  brightMagenta: '#e2c5ff',
  brightCyan: '#b3f0ff',
  brightWhite: '#ffffff',
};

const fontFamily =
  '"SFMono-Regular", ui-monospace, "JetBrains Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace';

export async function mountDemo(
  options: MountDemoOptions,
): Promise<MountedDemo> {
  const [{Terminal}, {FitAddon}, coreModule, {default: React}] = await Promise.all([
    import('@xterm/xterm'),
    import('@xterm/addon-fit'),
    import('@nemesis-oss/termina-core'),
    import('react'),
  ]);
  const {render} = coreModule;

  // xterm.js measures its cell size from the rendered font. If the monospace
  // webfont is still loading it computes columns from the fallback font, and
  // the swap moments later changes the cell width — a resize that tears the
  // first frames apart when each rendered line wraps differently. Waiting for
  // the fonts makes the first measurement final.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const {element, component, rows} = options;
  const renderOptions = options.renderOptions ?? {};

  const terminal = new Terminal({
    cols: 80,
    rows,
    scrollback: 0,
    // Real terminals run with the kernel line discipline's ONLCR on: a `\n`
    // written by an app reaches the screen as `\r\n`. The renderer's frames
    // rely on that translation — without it every line after a full-width one
    // drifts sideways. xterm.js leaves translation off by default, so switch
    // it on to match a real tty.
    convertEol: true,
    fontFamily,
    fontSize: 13,
    lineHeight: 1.3,
    letterSpacing: 0,
    cursorBlink: false,
    cursorStyle: 'bar',
    allowProposedApi: true,
    theme: terminalTheme,
  });

  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(element);

  // Fit the width to the card; keep the demo's fixed row height.
  const fitToCard = () => {
    if (element.clientWidth === 0) {
      return;
    }

    fitAddon.fit();
    if (terminal.rows !== rows) {
      terminal.resize(terminal.cols, rows);
    }
  };

  fitToCard();

  const stdout = new FakeStdout(terminal);
  const stderr = new FakeStderr(terminal);
  const stdin = new FakeStdin();

  const dataSubscription = terminal.onData(data => {
    stdin.push(data);
  });

  // xterm.js 5.x exposes no onFocus/onBlur events; the underlying textarea
  // sits inside our element, so focusin/focusout bubbling gives the same
  // signal without reaching into private API.
  const handleFocusIn = () => {
    options.onFocusChange?.(true);
  };

  const handleFocusOut = () => {
    options.onFocusChange?.(false);
  };

  element.addEventListener('focusin', handleFocusIn);
  element.addEventListener('focusout', handleFocusOut);

  const resizeObserver = new ResizeObserver(() => {
    fitToCard();
    stdout.announceResize();
  });
  resizeObserver.observe(element);

  const instance = render(React.createElement(component), {
    stdout,
    stdin,
    stderr,
    patchConsole: false,
    exitOnCtrlC: renderOptions.exitOnCtrlC ?? false,
    alternateScreen: renderOptions.alternateScreen ?? false,
    mouse: renderOptions.mouse ?? false,
  });

  let disposed = false;

  // Surfacing exits lets the wrapper offer a Restart button instead of a
  // frozen frame. waitUntilExit() rejects when the app exits with an error.
  instance.waitUntilExit().then(
    () => {
      if (!disposed) {
        options.onExit?.();
      }
    },
    error => {
      console.error('[termina preview] the demo app crashed', error);
      if (!disposed) {
        options.onExit?.();
      }
    },
  );

  return {
    focus() {
      terminal.focus();
    },
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      resizeObserver.disconnect();
      dataSubscription.dispose();
      element.removeEventListener('focusin', handleFocusIn);
      element.removeEventListener('focusout', handleFocusOut);

      try {
        instance.unmount();
      } catch (error) {
        console.error('[termina preview] failed to unmount', error);
      }

      terminal.dispose();
    },
  };
}
