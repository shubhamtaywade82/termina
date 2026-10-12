// Browser shim for `node:url`, used by termina-core's ErrorOverview to turn
// stack-trace file URLs into paths. Previews never have real files behind
// them, so every conversion is the identity.

export const fileURLToPath = (url: unknown): string => String(url);
export const pathToFileURL = (path: string): URL => new URL(`file://${path}`);
export default {fileURLToPath, pathToFileURL};
