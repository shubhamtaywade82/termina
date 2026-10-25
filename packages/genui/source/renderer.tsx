/* eslint-disable @typescript-eslint/naming-convention -- The GenUI* names are public exports, so they keep their spelling. */
/* eslint-disable @typescript-eslint/no-restricted-types -- A node can be JSON null, which is a value the model sent rather than an absent one. */
import React, {useEffect, useMemo, useReducer, useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {isRecord} from './guards.js';
import {createGenUIRuntime} from './runtime.js';
import {sanitizeText} from './sanitize.js';
import type {
	GenUIActionDispatcher,
	GenUIElementNode,
	GenUINode,
	GenUIRegistry,
	GenUIRenderContext,
	GenUIRuntime,
} from './types.js';

export type GenUIRendererProps = {
	readonly node?: GenUINode | null;
	readonly registry: GenUIRegistry;
	readonly runtime?: GenUIRuntime;
	readonly actionDispatcher?: GenUIActionDispatcher;
	readonly isStreaming?: boolean;
	readonly fallback?: (node: GenUINode) => React.ReactNode;
};

// Nodes come from model output, so the check reads the shape instead of trusting the type.
function isElementNode(value: unknown): value is GenUIElementNode {
	return (
		isRecord(value) &&
		value['type'] === 'element' &&
		typeof value['name'] === 'string'
	);
}

// A node without a statement id has no identity of its own, so its position is its key.
function childKey(child: unknown, index: number): string | number {
	return isElementNode(child) && child.id !== undefined && child.id !== ''
		? child.id
		: index;
}

export function GenUIRenderer({
	node,
	registry,
	runtime,
	actionDispatcher,
	isStreaming,
	fallback,
}: GenUIRendererProps): React.ReactNode {
	// Runtime changes re-render the tree, so the subscription only needs to force a render.
	const [, forceRender] = useReducer((count: number) => count + 1, 0);
	const [actionError, setActionError] = useState<string | undefined>(undefined);
	const activeRuntime = useMemo(
		() => runtime ?? createGenUIRuntime(),
		[runtime],
	);

	// Subscribe to runtime state mutations for reactive form re-rendering
	useEffect(
		() =>
			activeRuntime.subscribe(() => {
				forceRender();
			}),
		[activeRuntime],
	);

	const dispatchAction = useMemo(
		() =>
			// Components fire actions from input handlers with no one awaiting them, so a rejection here would be unhandled and kill the process. Show it instead.
			async (name: string, payload: unknown) => {
				if (!actionDispatcher) {
					return undefined;
				}

				try {
					const result = await actionDispatcher.dispatch(name, payload);
					setActionError(undefined);
					return result;
				} catch (error: unknown) {
					setActionError(
						`Action "${name}" failed: ${error instanceof Error ? error.message : String(error)}`,
					);
					return undefined;
				}
			},
		[actionDispatcher],
	);

	function renderNode(target: unknown): React.ReactNode {
		if (target === undefined || target === null) {
			return null;
		}

		if (typeof target === 'string') {
			return <Text>{sanitizeText(target)}</Text>;
		}

		if (typeof target === 'number' || typeof target === 'boolean') {
			return <Text>{String(target)}</Text>;
		}

		if (Array.isArray(target)) {
			return renderChildren(target);
		}

		return isElementNode(target) ? renderElement(target) : null;
	}

	function renderChildren(children: unknown): React.ReactNode {
		if (Array.isArray(children)) {
			return children.map((child: unknown, index: number) => (
				<React.Fragment key={childKey(child, index)}>
					{renderNode(child)}
				</React.Fragment>
			));
		}

		return renderNode(children);
	}

	const renderContext: GenUIRenderContext = {
		runtime: activeRuntime,
		dispatchAction,
		renderChildren,
		isStreaming,
	};

	function renderElement(element: GenUIElementNode): React.ReactNode {
		const component = registry.get(element.name);
		if (!component) {
			if (fallback) {
				return fallback(element);
			}

			return (
				<Box borderStyle="single" borderColor="red">
					<Text color="red">Unknown component: {element.name}</Text>
				</Box>
			);
		}

		try {
			// The schema is the contract for props. A parser-validated tree passes this, and a hand-built one gets an error box instead of a render crash.
			const parsed = component.schema.safeParse(element.props);
			if (!parsed.success) {
				return (
					<Box borderStyle="single" borderColor="red">
						<Text color="red">
							Invalid props for {element.name}:{' '}
							{parsed.error.issues[0]?.message ?? 'Unknown'}
						</Text>
					</Box>
				);
			}

			return component.render(parsed.data, renderContext);
		} catch (error: unknown) {
			return (
				<Box borderStyle="single" borderColor="red">
					<Text color="red">
						Render error in {element.name}:{' '}
						{error instanceof Error ? error.message : 'Unknown'}
					</Text>
				</Box>
			);
		}
	}

	if (actionError === undefined) {
		return renderNode(node);
	}

	return (
		<Box flexDirection="column">
			{renderNode(node)}
			<Text color="red">{sanitizeText(actionError)}</Text>
		</Box>
	);
}
