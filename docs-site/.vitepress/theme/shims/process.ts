// Browser shim for `node:process` used by the live terminal previews.
//
// The termina renderer is a Node package: it reads terminal capabilities from
// `process.env`, compares against `process.stdin`/`process.stdout`, and CJS
// dependencies such as signal-exit attach lifecycle listeners to the global
// `process`. In the browser we only ever run `render()` against fake streams
// owned by the preview harness, so a small inert stand-in is enough.
//
// The environment mimics a modern color terminal so capability detection picks
// truecolor, mouse, hyperlinks, and interactive mode — matching what xterm.js
// in the preview actually supports.

// Note: `kill` and `reallyExit` are deliberately absent. signal-exit probes
// for them to decide whether it is running under real Node; without them it
// installs its own browser no-op (`onExit()` returning an empty unsubscribe),
// which is exactly the behavior previews want — there are no POSIX signals to
// catch in a page. Everything else on this object is inert by design.

type Listener = (...args: any[]) => void;

const env: Record<string, string | undefined> = {
  TERM: 'xterm-256color',
  COLORTERM: 'truecolor',
  TERM_PROGRAM: 'xterm.js',
  NODE_ENV: 'production',
};

const inertStream = {
  write() {
    return true;
  },
  end() {},
  on() {
    return this;
  },
  off() {
    return this;
  },
  once() {
    return this;
  },
  addListener() {
    return this;
  },
  removeListener() {
    return this;
  },
  emit() {
    return false;
  },
  isTTY: false,
  columns: 80,
  rows: 24,
  destroyed: false,
};

const processLike = {
  env,
  platform: 'linux',
  arch: 'x64',
  argv: [],
  argv0: 'node',
  execPath: '/usr/bin/node',
  pid: 1,
  ppid: 0,
  version: 'v22.0.0',
  browser: true,
  exitCode: undefined,
  __signal_exit_emitter__: undefined,
  cwd() {
    return '/';
  },
  exit() {},
  uptime() {
    return 0;
  },
  nextTick(callback: (...args: any[]) => void, ...args: any[]) {
    queueMicrotask(() => {
      callback(...args);
    });
  },
  stdout: inertStream,
  stderr: inertStream,
  stdin: {...inertStream, isTTY: false, setRawMode() {}},
  on() {
    return this;
  },
  once() {
    return this;
  },
  off() {
    return this;
  },
  addListener() {
    return this;
  },
  removeListener() {
    return this;
  },
  listeners() {
    return [] as Listener[];
  },
  listenerCount() {
    return 0;
  },
  emit() {
    return false;
  },
};

export default processLike;
export {
  env,
  platform,
  arch,
  argv,
  argv0,
  pid,
  ppid,
  version,
  browser,
};
export const {
  cwd,
  exit,
  kill,
  uptime,
  nextTick,
  stdout,
  stderr,
  stdin,
  on,
  once,
  off,
  addListener,
  removeListener,
  listeners,
  listenerCount,
  emit,
} = processLike;
export const environment = env;
