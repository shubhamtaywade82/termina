import type {
	GenUIElementNode,
	GenUIParseResult,
	GenUIStreamStatus,
	GenUIStreamUpdate,
} from './types.js';

type LanguageAdapterLike = {
	readonly parse: (code: string) => GenUIParseResult;
	readonly parseStreaming: (code: string) => GenUIParseResult;
};

export type StreamCoordinator = {
	readonly append: (chunk: string) => GenUIStreamUpdate;
	readonly complete: () => GenUIStreamUpdate;
	readonly reset: () => void;
	readonly getState: () => GenUIStreamUpdate;
	readonly subscribe: (listener: (update: GenUIStreamUpdate) => void) => () => void;
};

export function createStreamCoordinator(adapter: LanguageAdapterLike): StreamCoordinator {
	let rawText = '';
	let status: GenUIStreamStatus = 'streaming';
	let lastValidTree: GenUIElementNode | null = null;
	let lastParseResult: GenUIParseResult = {
		root: null,
		isIncomplete: true,
		unresolved: [],
		errors: [],
	};

	const listeners = new Set<(update: GenUIStreamUpdate) => void>();

	function getCurrentUpdate(): GenUIStreamUpdate {
		return {
			tree: lastParseResult.root ?? lastValidTree,
			rawText,
			status,
			parseResult: lastParseResult,
		};
	}

	function notify(): GenUIStreamUpdate {
		const update = getCurrentUpdate();
		for (const listener of listeners) {
			listener(update);
		}
		return update;
	}

	function append(chunk: string): GenUIStreamUpdate {
		rawText += chunk;
		status = 'streaming';
		lastParseResult = adapter.parseStreaming(rawText);

		if (lastParseResult.root) {
			lastValidTree = lastParseResult.root;
		}

		return notify();
	}

	function complete(): GenUIStreamUpdate {
		status = 'completed';
		lastParseResult = adapter.parse(rawText);

		if (lastParseResult.root) {
			lastValidTree = lastParseResult.root;
		}

		return notify();
	}

	function reset(): void {
		rawText = '';
		status = 'streaming';
		lastValidTree = null;
		lastParseResult = {
			root: null,
			isIncomplete: true,
			unresolved: [],
			errors: [],
		};
		notify();
	}

	return {
		append,
		complete,
		reset,
		getState: getCurrentUpdate,
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}
