import {
	createParser,
	createStreamingParser,
	type ParseResult,
} from '@openuidev/lang-core';
import {isRecord} from './guards.js';
import {sanitizeText} from './sanitize.js';
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
	maxNodeCount: 1000,
	maxTextLength: 10_000,
};

type NormalizeContext = {
	readonly limits: Required<GenUIResourceLimits>;
	nodeCount: number;
};

// Each field is read through a check, because the tree arrives from a model and nothing about its shape is guaranteed.
type RawElement = {
	readonly typeName?: unknown;
	readonly statementId?: unknown;
	readonly partial?: unknown;
	readonly props?: unknown;
};

function normalizeValue(
	value: unknown,
	depth: number,
	ctx: NormalizeContext,
): GenUINode {
	if (depth > ctx.limits.maxTreeDepth) {
		throw new Error(`Tree depth exceeds limit of ${ctx.limits.maxTreeDepth}`);
	}

	if (typeof value === 'string') {
		return sanitizeText(value, ctx.limits.maxTextLength);
	}

	if (
		typeof value === 'number' ||
		typeof value === 'boolean' ||
		value === null
	) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item: unknown) => normalizeValue(item, depth + 1, ctx));
	}

	if (isRecord(value)) {
		if (value['type'] === 'element') {
			return normalizeElement(value, depth + 1, ctx);
		}

		const record: Record<string, GenUINode> = {};
		for (const [key, child] of Object.entries(value)) {
			record[key] = normalizeValue(child, depth + 1, ctx);
		}

		return record;
	}

	return null;
}

function normalizeElement(
	raw: RawElement,
	depth: number,
	ctx: NormalizeContext,
): GenUIElementNode {
	ctx.nodeCount++;
	if (ctx.nodeCount > ctx.limits.maxNodeCount) {
		throw new Error(`Node count exceeds limit of ${ctx.limits.maxNodeCount}`);
	}

	const props: Record<string, unknown> = {};
	if (isRecord(raw.props)) {
		for (const [key, value] of Object.entries(raw.props)) {
			props[key] = normalizeValue(value, depth, ctx);
		}
	}

	return {
		type: 'element',
		name: typeof raw.typeName === 'string' ? raw.typeName : 'Unknown',
		props,
		id: typeof raw.statementId === 'string' ? raw.statementId : undefined,
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
	const parser = createParser(schema);
	const streamingParser = createStreamingParser(schema);

	function buildResult(
		rawResult: ParseResult,
		isStream = false,
	): GenUIParseResult {
		const errors: GenUIError[] = rawResult.meta.errors.map((error) => ({
			code: error.code,
			message: error.message,
			path: error.path,
			component: error.component,
		}));

		if (!rawResult.root) {
			return {
				root: null,
				isIncomplete: rawResult.meta.incomplete || isStream,
				unresolved: rawResult.meta.unresolved,
				errors,
			};
		}

		try {
			const ctx: NormalizeContext = {limits, nodeCount: 0};
			const root = normalizeElement(rawResult.root, 1, ctx);
			return {
				root,
				isIncomplete: rawResult.meta.incomplete,
				unresolved: rawResult.meta.unresolved,
				errors,
			};
		} catch (error: unknown) {
			return {
				root: null,
				isIncomplete: false,
				unresolved: [],
				errors: [
					{
						code: 'resource-limit',
						message: error instanceof Error ? error.message : String(error),
					},
				],
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
					errors: [
						{
							code: 'resource-limit',
							message: `Stream length ${code.length} exceeds limit of ${limits.maxStreamLength}`,
						},
					],
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
					errors: [
						{
							code: 'resource-limit',
							message: `Stream length ${code.length} exceeds limit of ${limits.maxStreamLength}`,
						},
					],
				};
			}

			return buildResult(streamingParser.set(code), true);
		},
	};
}
