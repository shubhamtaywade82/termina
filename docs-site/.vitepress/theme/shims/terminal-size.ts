// Browser stub for the `terminal-size` package.
//
// The real package shells out to `resize` and imports `node:child_process`,
// `node:fs` and `node:tty`, none of which exist in the browser. termina-core
// only calls it when the render stream reports no size, and the preview's fake
// stdout always carries the live xterm.js dimensions, so the fallback here is
// never used — it exists purely to keep the import graph resolvable.

const terminalSize = (): {columns: number; rows: number} => ({
  columns: 80,
  rows: 24,
});

export default terminalSize;
