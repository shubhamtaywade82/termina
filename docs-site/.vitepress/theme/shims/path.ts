// Browser shim for `node:path`, used by termina-core's ErrorOverview for
// relative path display. The string implementations below cover the POSIX
// behavior of the calls that can run in the preview error path.

const normalize = (path: string): string =>
  path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

export const relative = (from: string, to: string): string => {
  const fromParts = normalize(from).split('/').filter(Boolean);
  const toParts = normalize(to).split('/').filter(Boolean);

  let common = 0;
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common++;
  }

  const up = fromParts.slice(common).map(() => '..');
  return [...up, ...toParts.slice(common)].join('/') || '.';
};

export const resolve = (...parts: string[]): string => {
  const joined = parts.length > 0 ? parts.join('/') : '.';
  return normalize(joined.startsWith('/') ? joined : `/${joined}`);
};

export const join = (...parts: string[]): string => normalize(parts.join('/'));
export const basename = (path: string): string =>
  normalize(path).split('/').filter(Boolean).pop() ?? '';
export const dirname = (path: string): string => {
  const parts = normalize(path).split('/').filter(Boolean);
  parts.pop();
  return parts.length > 0 ? `/${parts.join('/')}` : '/';
};

export default {relative, resolve, join, basename, dirname};
