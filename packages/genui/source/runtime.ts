import type { z } from 'zod';
import type { GenUIRuntime } from './types.js';

export type GenUIValidationResult = {
	readonly success: boolean;
	readonly error?: string;
};

export type ExtendedGenUIRuntime = GenUIRuntime & {
	readonly validate: (name: string, schema: z.ZodType<unknown>) => GenUIValidationResult;
};

export function createGenUIRuntime(
	initialValues: Record<string, unknown> = {},
): ExtendedGenUIRuntime {
	const initialSnapshot = { ...initialValues };
	const state = new Map<string, unknown>(Object.entries(initialSnapshot));
	const listeners = new Set<() => void>();

	function notify(): void {
		for (const listener of listeners) {
			listener();
		}
	}

	return {
		getValue(name: string): unknown {
			return state.get(name);
		},

		setValue(name: string, value: unknown): void {
			state.set(name, value);
			notify();
		},

		getValues(): Record<string, unknown> {
			return Object.fromEntries(state.entries());
		},

		reset(): void {
			state.clear();
			for (const [key, value] of Object.entries(initialSnapshot)) {
				state.set(key, value);
			}
			notify();
		},

		validate(name: string, schema: z.ZodType<unknown>): GenUIValidationResult {
			const value = state.get(name);
			const parseResult = schema.safeParse(value);
			if (parseResult.success) {
				return { success: true };
			}
			return {
				success: false,
				error: parseResult.error.issues[0]?.message ?? 'Invalid value',
			};
		},

		subscribe(listener: () => void): () => void {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}
