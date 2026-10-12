// Browser shim for `node:stream`.
//
// termina's `render()` accepts either an options object or a `Stream` to write
// to (the historical `render(<App/>, process.stdout)` signature). The preview
// harness always passes options, so the `instanceof Stream` check must simply
// return false for them. Nothing else from node:stream runs in the browser.

export class Stream {
  constructor() {
    if (new.target === Stream) {
      // Stream is only used as a constructor tag by render(); nothing should
      // ever instantiate it in the browser.
    }
  }
}

export class Writable extends Stream {}

export default Stream;
export const Readable = Stream;
export const Duplex = Stream;
export const Transform = Stream;
export const PassThrough = Writable;
