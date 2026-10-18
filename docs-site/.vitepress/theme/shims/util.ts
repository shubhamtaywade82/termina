// Browser shim for `node:util`.
//
// Three functions are needed by the packages bundled into the live previews:
//
// - `isDeepStrictEqual` (termina-ui Select/MultiSelect state comparison)
// - `types.isNativeError` and `types.isPromise` (termina-core renderToString
//   and ErrorBoundary)
// - `stripVTControlCharacters` (termina-core reflow, reached through the
//   Text/Ansi rendering paths of the live examples)

function isDeepStrictEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b || a === null || b === null) {
    return false;
  }

  if (typeof a !== 'object') {
    return Number.isNaN(a) && Number.isNaN(b);
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (a instanceof Date || b instanceof Date) {
    return false;
  }

  if (Array.isArray(a)) {
    if (a.length !== (b as unknown[]).length) {
      return false;
    }

    return a.every((item, index) =>
      isDeepStrictEqual(item, (b as unknown[])[index]),
    );
  }

  const aKeys = Object.keys(a as object).sort();
  const bKeys = Object.keys(b as object).sort();
  if (aKeys.length !== bKeys.length || !aKeys.every((key, i) => key === bKeys[i])) {
    return false;
  }

  return aKeys.every(key =>
    isDeepStrictEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

export const types = {
  isNativeError(value: unknown): boolean {
    return value instanceof Error;
  },
  isPromise(value: unknown): boolean {
    return (
      typeof (value as Promise<unknown> | undefined)?.then === 'function'
    );
  },
  isBoxedPrimitive(value: unknown): boolean {
    return (
      value instanceof String ||
      value instanceof Number ||
      value instanceof Boolean ||
      value instanceof Symbol ||
      value instanceof BigInt
    );
  },
};

export {isDeepStrictEqual};
export const inspect = (value: unknown): string => String(value);
export const promisify = <T extends (...args: any[]) => any>(fn: T) => fn;
export const callbackify = <T extends (...args: any[]) => any>(fn: T) => fn;
// Mirrors node:util's stripVTControlCharacters (same regex Node uses): drops
// ANSI escape sequences - CSI, OSC terminations, and other VT sequences - so
// reflow sees plain text in the browser bundle.
const vtControlPattern = new RegExp(
  [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  ].join('|'),
  'g',
);

export function stripVTControlCharacters(str: string): string {
  return str.replace(vtControlPattern, '');
}

export default {types, isDeepStrictEqual, inspect, promisify, callbackify, stripVTControlCharacters};
