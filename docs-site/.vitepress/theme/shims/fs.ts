// Browser shim for `node:fs`.
//
// Only reached through termina-core's error reporting path (ErrorOverview
// reads source excerpts to annotate stack traces). In the browser previews we
// simply report "no source available" — the error message itself still shows.

export const readFileSync = (): string => '';
export const existsSync = (): boolean => false;
export const readFile = (_path: unknown, callback: (error: Error | null, data?: string) => void): void => {
  callback(null, '');
};
export const writeFile = (_path: unknown, _data: unknown, callback?: (error: Error | null) => void): void => {
  callback?.(null);
};
export default {readFileSync, existsSync, readFile, writeFile};
