// Fake TTY streams that connect termina's renderer to an xterm.js terminal
// running in the browser.
//
// The renderer only needs a small slice of Node's stream API:
//
// - stdout: `write()`, `isTTY`, `columns`/`rows` and `on('resize')`
// - stdin:  a TTY-like readable with `setRawMode()`, `setEncoding()` and
//           Node's `'readable'`-event + `read()` flowing mode
//
// Every byte the renderer writes goes straight into xterm.js, which interprets
// the ANSI stream exactly like a real terminal — cursor movement, erase,
// synchronized updates, SGR mouse tracking and alternate screen included.
// Keystrokes travel the opposite way: xterm.js reports them through
// `onData()`, the harness pushes them into FakeStdin, and termina's input
// parser reads them back out.

import type {Terminal} from '@xterm/xterm';

type Listener = (...args: any[]) => void;

abstract class EventTargetLike {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }

    set.add(listener);
    return this;
  }

  addListener(event: string, listener: Listener): this {
    return this.on(event, listener);
  }

  once(event: string, listener: Listener): this {
    const wrapped: Listener = (...args: any[]) => {
      this.off(event, wrapped);
      listener(...args);
    };

    this.on(event, wrapped);
    return this;
  }

  off(event: string, listener: Listener): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  removeListener(event: string, listener: Listener): this {
    return this.off(event, listener);
  }

  emit(event: string, ...args: any[]): boolean {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) {
      return false;
    }

    for (const listener of [...set]) {
      listener(...args);
    }

    return true;
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export class FakeStdout extends EventTargetLike {
  readonly isTTY = true;
  destroyed = false;
  writableEnded = false;

  constructor(private readonly terminal: Terminal) {
    super();
  }

  get columns(): number {
    return this.terminal.cols;
  }

  get rows(): number {
    return this.terminal.rows;
  }

  write(data: string): boolean {
    this.terminal.write(data);
    return true;
  }

  /** Announce a resize after the underlying Terminal has been resized. */
  announceResize(): void {
    this.emit('resize');
  }
}

export class FakeStderr extends EventTargetLike {
  readonly isTTY = true;

  constructor(private readonly terminal: Terminal) {
    super();
  }

  get columns(): number {
    return this.terminal.cols;
  }

  get rows(): number {
    return this.terminal.rows;
  }

  write(data: string): boolean {
    this.terminal.write(data);
    return true;
  }
}

export class FakeStdin extends EventTargetLike {
  readonly isTTY = true;
  private queue: string[] = [];
  private readableScheduled = false;

  /** Called by the harness for every chunk xterm.js reports from the user. */
  push(chunk: string): void {
    if (chunk.length === 0) {
      return;
    }

    this.queue.push(chunk);

    if (this.readableScheduled) {
      return;
    }

    // Node emits 'readable' on the next tick; queueMicrotask keeps the same
    // out-of-band timing so the renderer never re-enters mid-write.
    this.readableScheduled = true;
    queueMicrotask(() => {
      this.readableScheduled = false;
      this.emit('readable');
    });
  }

  read(): string | null {
    return this.queue.length > 0 ? (this.queue.shift() as string) : null;
  }

  setRawMode(_isEnabled: boolean): this {
    // xterm.js already delivers unprocessed key bytes; there is no line
    // discipline to switch off in the browser.
    return this;
  }

  setEncoding(_encoding: string): this {
    return this;
  }

  ref(): this {
    return this;
  }

  unref(): this {
    return this;
  }

  resume(): this {
    return this;
  }

  pause(): this {
    return this;
  }

  destroy(): this {
    return this;
  }
}
