import type React from 'react';
import type { z } from 'zod';

export type GenUIPrimitive = string | number | boolean | null;

export type GenUIElementNode = {
	readonly type: 'element';
	readonly name: string;
	readonly props: Record<string, unknown>;
	readonly id?: string;
	readonly isPartial?: boolean;
};

export type GenUINode = GenUIElementNode | GenUIPrimitive | readonly GenUINode[];

export type GenUIError = {
	readonly code: string;
	readonly message: string;
	readonly path?: string;
	readonly component?: string;
};

export type GenUIParseResult = {
	readonly root: GenUIElementNode | null;
	readonly isIncomplete: boolean;
	readonly unresolved: readonly string[];
	readonly errors: readonly GenUIError[];
};

export type GenUIResourceLimits = {
	readonly maxStreamLength?: number;
	readonly maxTreeDepth?: number;
	readonly maxNodeCount?: number;
	readonly maxTextLength?: number;
};

export type GenUIRenderContext = {
	readonly runtime: GenUIRuntime;
	readonly dispatchAction: (name: string, payload: unknown) => Promise<unknown>;
	readonly renderChildren: (children: unknown) => React.ReactNode;
	readonly isStreaming?: boolean;
};

export type GenUIComponent<TProps = Record<string, unknown>> = {
	readonly name: string;
	readonly description: string;
	readonly schema: z.ZodType<TProps>;
	readonly render: (props: TProps, context: GenUIRenderContext) => React.ReactNode;
};

export type GenUIRegistry = {
	readonly get: (name: string) => GenUIComponent | undefined;
	readonly has: (name: string) => boolean;
	readonly getAll: () => readonly GenUIComponent[];
	readonly toJSONSchema: () => Record<string, unknown>;
};

export type GenUIAction<TInput = unknown> = {
	readonly name: string;
	readonly schema: z.ZodType<TInput>;
	readonly handler: (input: TInput) => Promise<unknown> | unknown;
};

export type GenUIActionDispatcher = {
	readonly register: <T>(action: GenUIAction<T>) => void;
	readonly dispatch: (name: string, payload: unknown) => Promise<unknown>;
	readonly has: (name: string) => boolean;
};

export type GenUIRuntime = {
	readonly getValue: (name: string) => unknown;
	readonly setValue: (name: string, value: unknown) => void;
	readonly getValues: () => Record<string, unknown>;
	readonly reset: () => void;
	readonly subscribe: (listener: () => void) => () => void;
};

export type GenUIStreamStatus = 'streaming' | 'completed' | 'error';

export type GenUIStreamUpdate = {
	readonly tree: GenUIElementNode | null;
	readonly rawText: string;
	readonly status: GenUIStreamStatus;
	readonly parseResult: GenUIParseResult;
	readonly error?: Error;
};
