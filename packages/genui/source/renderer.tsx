import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text } from '@nemesis-oss/termina-core';
import { createGenUIRuntime } from './runtime.js';
import { sanitizeText } from './sanitize.js';
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

export function GenUIRenderer({
	node,
	registry,
	runtime,
	actionDispatcher,
	isStreaming,
	fallback,
}: GenUIRendererProps): React.ReactNode {
	const [, setTick] = useState(0);
	const activeRuntime = useMemo(() => runtime ?? createGenUIRuntime(), [runtime]);

	// Subscribe to runtime state mutations for reactive form re-rendering
	useEffect(() => {
		return activeRuntime.subscribe(() => {
			setTick(prev => prev + 1);
		});
	}, [activeRuntime]);

	const dispatchAction = useMemo(() => {
		return async (name: string, payload: unknown) => {
			if (!actionDispatcher) return undefined;
			return actionDispatcher.dispatch(name, payload);
		};
	}, [actionDispatcher]);

	function renderNode(target: GenUINode | null | undefined): React.ReactNode {
		if (target == null) return null;

		if (typeof target === 'string') {
			return <Text>{sanitizeText(target)}</Text>;
		}

		if (typeof target === 'number' || typeof target === 'boolean') {
			return <Text>{String(target)}</Text>;
		}

		if (Array.isArray(target)) {
			return renderChildren(target);
		}

		if (typeof target === 'object' && 'type' in target && target.type === 'element') {
			return renderElement(target as GenUIElementNode);
		}

		return null;
	}

	function renderChildren(children: unknown): React.ReactNode {
		if (!children) return null;
		if (Array.isArray(children)) {
			return children.map((child, idx) => (
				<React.Fragment key={typeof child === 'object' && child?.id ? child.id : idx}>
					{renderNode(child)}
				</React.Fragment>
			));
		}
		return renderNode(children as GenUINode);
	}

	const renderContext: GenUIRenderContext = {
		runtime: activeRuntime,
		dispatchAction,
		renderChildren,
		isStreaming,
	};

	function renderElement(elem: GenUIElementNode): React.ReactNode {
		const comp = registry.get(elem.name);
		if (!comp) {
			if (fallback) return fallback(elem);
			return (
				<Box borderStyle="single" borderColor="red">
					<Text color="red">Unknown component: {elem.name}</Text>
				</Box>
			);
		}

		try {
			return comp.render(elem.props, renderContext);
		} catch (error: any) {
			return (
				<Box borderStyle="single" borderColor="red">
					<Text color="red">Render error in {elem.name}: {error?.message ?? 'Unknown'}</Text>
				</Box>
			);
		}
	}

	return renderNode(node);
}
