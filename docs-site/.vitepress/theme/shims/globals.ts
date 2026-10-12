// Installs browser globals that Node packages expect before any termina code
// is dynamically imported by the live previews.
//
// - `process`: signal-exit, restore-cursor and friends access the bare global
//   rather than importing `node:process`; the same inert shim is used for both
//   paths so they observe one object.
// - `setImmediate`/`clearImmediate`: termina-core's scheduler yields with
//   setImmediate between frames.
// - `global`: some CJS transitive dependencies reference it.

import processLike from './process';

type GlobalShape = typeof globalThis & {
  process?: unknown;
  setImmediate?: (callback: (...args: any[]) => void, ...args: any[]) => void;
  clearImmediate?: (handle: number) => void;
  global?: unknown;
};

const globals = globalThis as GlobalShape;

if (globals.process === undefined) {
  globals.process = processLike;
}

if (globals.setImmediate === undefined) {
  globals.setImmediate = (callback, ...args) =>
    setTimeout(() => callback(...args), 0) as unknown as number;
}

if (globals.clearImmediate === undefined) {
  globals.clearImmediate = handle => clearTimeout(handle);
}

if (globals.global === undefined) {
  globals.global = globalThis;
}

export {};
