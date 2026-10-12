// Browser shim for `node:events`.
//
// termina's App component and StdinContext create EventEmitters to fan input
// events out to hooks. This implements the small surface they use:
// on/addListener, off/removeListener, once, emit, listenerCount and
// removeAllListeners. It intentionally supports only one argument per listener
// and no special Node event names ('newListener' and friends).

type Listener = (...args: any[]) => void;

export class EventEmitter {
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

  removeAllListeners(event?: string): this {
    if (event === undefined) {
      this.listeners.clear();
    } else {
      this.listeners.delete(event);
    }

    return this;
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

  setMaxListeners(_n: number | undefined): this {
    // Node's EventEmitter uses this only to warn about leaks; the preview
    // harness never registers enough listeners to matter.
    return this;
  }

  getMaxListeners(): number {
    return Number.POSITIVE_INFINITY;
  }

  prependListener(event: string, listener: Listener): this {
    // Insertion order is irrelevant to every consumer in the preview; fall
    // back to a normal subscription.
    return this.on(event, listener);
  }

  prependOnceListener(event: string, listener: Listener): this {
    return this.once(event, listener);
  }

  rawListeners(event: string): Listener[] {
    return [...(this.listeners.get(event) ?? [])];
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  eventNames(): string[] {
    return [...this.listeners.keys()];
  }
}

export default EventEmitter;
