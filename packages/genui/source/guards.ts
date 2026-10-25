// Narrows values from model output, which is untyped until a check has run.
export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasText(value: string | undefined): value is string {
	return value !== undefined && value !== '';
}
