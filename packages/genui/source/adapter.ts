import { createParser, createStreamingParser } from '@openuidev/lang-core';
import { sanitizeText } from './sanitize.js';
import type {
	GenUIElementNode,
	GenUIError,
	GenUINode,
	GenUIParseResult,
	GenUIRegistry,
	GenUIResourceLimits,
} from './types.js';

export const DEFAULT_LIMITS: Required<GenUIResourceLimits> = {
	maxStreamLength: 100_000,
	maxTreeDepth: 20,
	maxNodeCount: 1_000,
	maxTextLength: 10_000,
};

type NormalizeContext = {
	readonly limits: Required<GenUIResourceLimits>;
	nodeCount: number;
};

function normalizeValue(value: unknown, depth: number, ctx: NormalizeContext): GenUINode {
	if (depth > ctx.limits.maxTreeDepth) {
		throw new Error(`Tree depth exceeds limit of ${ctx.limits.maxTreeDepth}`);
	}

	if (typeof value === 'string') {
		return sanitizeText(value, ctx.limits.maxTextLength);
	}

	if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map(item => normalizeValue(item, depth + 1, ctx));
	}

	if (value && typeof value === 'object' && (value as any).type === 'element') {
		return normalizeElement(value, depth + 1, ctx);
	}

	return null;
}

function normalizeElement(raw: any, depth: number, ctx: NormalizeContext): GenUIElementNode {
	ctx.nodeCount++;
	if (ctx.nodeCount > ctx.limits.maxNodeCount) {
		throw new Error(`Node count exceeds limit of ${ctx.limits.maxNodeCount}`);
	}

	const props: Record<string, unknown> = {};
	if (raw.props && typeof raw.props === 'object') {
		for (const [key, val] of Object.entries(raw.props)) {
			props[key] = normalizeValue(val, depth, ctx);
		}
	}

	return {
		type: 'element',
		name: raw.typeName ?? 'Unknown',
		props,
		id: raw.statementId,
		isPartial: Boolean(raw.partial),
	};
}

export function createLanguageAdapter(
	registry: GenUIRegistry,
	customLimits: GenUIResourceLimits = {},
) {
	const limits: Required<GenUIResourceLimits> = {
		...DEFAULT_LIMITS,
		...customLimits,
	};
	const schema = registry.toJSONSchema();
	const parser = createParser(schema as any);
	const streamingParser = createStreamingParser(schema as any);

	function buildResult(rawResult: any, isStream = false): GenUIParseResult {
		const errors: GenUIError[] = [];

		if (rawResult?.meta?.errors) {
			for (const err of rawResult.meta.errors) {
				errors.push({
					code: err.code ?? 'unknown-error',
					message: err.message ?? 'Unknown validation error',
					path: err.path,
					component: err.component,
				});
			}
		}

		if (!rawResult?.root) {
			return {
				root: null,
				isIncomplete: Boolean(rawResult?.meta?.incomplete) || (isStream && !rawResult?.root),
				unresolved: rawResult?.meta?.unresolved ?? [],
				errors,
			};
		}

		try {
			const ctx: NormalizeContext = { limits, nodeCount: 0 };
			const root = normalizeElement(rawResult.root, 1, ctx);
			return {
				root,
				isIncomplete: Boolean(rawResult.meta?.incomplete),
				unresolved: rawResult.meta?.unresolved ?? [],
				errors,
			};
		} catch (error: any) {
			return {
				root: null,
				isIncomplete: false,
				unresolved: [],
				errors: [{ code: 'resource-limit', message: error.message }],
			};
		}
	}

	return {
		parse(code: string): GenUIParseResult {
			if (code.length > limits.maxStreamLength) {
				return {
					root: null,
					isIncomplete: false,
					unresolved: [],
					errors: [{
						code: 'resource-limit',
						message: `Stream length ${code.length} exceeds limit of ${limits.maxStreamLength}`,
					}],
				};
			}
			return buildResult(parser.parse(code), false);
		},

		parseStreaming(code: string): GenUIParseResult {
			if (code.length > limits.maxStreamLength) {
				return {
					root: null,
					isIncomplete: false,
					unresolved: [],
					errors: [{
						code: 'resource-limit',
						message: `Stream length ${code.length} exceeds limit of ${limits.maxStreamLength}`,
					}],
				};
			}
			return buildResult(streamingParser.set(code), true);
		},
	};
}
