import React from 'react';
import test, { type TestContext } from 'node:test';
import { z } from 'zod';
import { Text } from '@nemesis-oss/termina-core';
import { createDefaultRegistry, createGenUIRegistry } from '../source/registry.js';
import type { GenUINode, GenUIRenderContext } from '../source/types.js';
import { createLanguageAdapter } from '../source/adapter.js';
import { createGenUIRuntime } from '../source/runtime.js';
import { createActionDispatcher } from '../source/actions.js';
import { GenUIRenderer } from '../source/renderer.js';
import { render } from './helpers/render.js';

const registry = createDefaultRegistry();
const adapter = createLanguageAdapter(registry);

test('renders container and text through actual Termina primitives', (t: TestContext) => {
	const code = `
root = Container("column", 1, "single", [title, status])
title = Text("Server Status", "cyan", true)
status = StatusMessage("All systems operational", "success")
`;
	const { root } = adapter.parse(code);
	t.assert.ok(root);

	const { lastFrame, unmount } = render(<GenUIRenderer node={root} registry={registry} />);
	const frame = lastFrame();
	unmount();

	t.assert.ok(frame?.includes('Server Status'));
	t.assert.ok(frame?.includes('All systems operational'));
});

test('renders badges and alerts with variants', (t: TestContext) => {
	const code = `
root = Container("column", 0, "none", [b, a])
b = Badge("v1.2.0", "info")
a = Alert("Security Warning", "Upgrade recommended", "warning")
`;
	const { root } = adapter.parse(code);
	t.assert.ok(root);

	const { lastFrame, unmount } = render(<GenUIRenderer node={root} registry={registry} />);
	const frame = lastFrame();
	unmount();

	t.assert.ok(frame?.includes('V1.2.0'));
	t.assert.ok(frame?.includes('Security Warning'));
	t.assert.ok(frame?.includes('Upgrade recommended'));
});

test('renders progress bar and code block', (t: TestContext) => {
	const code = `
root = Container("column", 0, "none", [p, c])
p = ProgressBar(75, "Deploying")
c = CodeBlock("const x = 42;", "typescript")
`;
	const { root } = adapter.parse(code);
	t.assert.ok(root);

	const { lastFrame, unmount } = render(<GenUIRenderer node={root} registry={registry} />);
	const frame = lastFrame();
	unmount();

	t.assert.ok(frame?.includes('Deploying'));
	t.assert.ok(frame?.includes('const x = 42;'));
});

test('renders safe fallback when encountering unknown component', (t: TestContext) => {
	const unknownNode = {
		type: 'element' as const,
		name: 'UnknownWidget',
		props: { data: 'test' },
	};

	const { lastFrame, unmount } = render(<GenUIRenderer node={unknownNode} registry={registry} />);
	const frame = lastFrame();
	unmount();

	t.assert.ok(frame?.includes('Unknown component: UnknownWidget'));
});

test('integrates with runtime state for text inputs', (t: TestContext) => {
	const runtime = createGenUIRuntime({ username: 'initial-user' });
	const code = `
root = TextInput("username", "Username", "Enter name", "default")
`;
	const { root } = adapter.parse(code);
	t.assert.ok(root);

	const { lastFrame, unmount } = render(
		<GenUIRenderer node={root} registry={registry} runtime={runtime} />,
	);
	const frame = lastFrame();
	unmount();

	t.assert.ok(frame?.includes('initial-user') || frame?.includes('Username'));
});

test('renders button with action dispatcher configured', (t: TestContext) => {
	const dispatcher = createActionDispatcher();
	const code = `
root = Button("Click Me", "customAction")
`;
	const { root } = adapter.parse(code);
	t.assert.ok(root);

	const { lastFrame, unmount } = render(
		<GenUIRenderer node={root} registry={registry} actionDispatcher={dispatcher} />,
	);
	const frame = lastFrame();
	unmount();

	t.assert.ok(frame?.includes('Click Me'));
});


test('seeds an untouched TextInput default into the runtime so actions receive it', async (t: TestContext) => {
	const runtime = createGenUIRuntime();
	const { root } = adapter.parse('root = TextInput("city", "City", "", "Pune")');
	t.assert.ok(root);

	const { unmount } = render(<GenUIRenderer node={root} registry={registry} runtime={runtime} />);
	await new Promise(resolve => setTimeout(resolve, 20));
	unmount();

	t.assert.deepStrictEqual(runtime.getValues(), { city: 'Pune' });
});

test('shows a failed action instead of rejecting unhandled', async (t: TestContext) => {
	const fireOnRender = createGenUIRegistry([
		{
			name: 'Fire',
			description: 'Dispatches an unregistered action',
			schema: z.object({}),
			render: (_props: any, ctx: GenUIRenderContext) => {
				void ctx.dispatchAction('missing', {});
				return <Text>fired</Text>;
			},
		},
	]);
	const node = { type: 'element', name: 'Fire', props: {} } as unknown as GenUINode;

	const { lastFrame, unmount } = render(
		<GenUIRenderer node={node} registry={fireOnRender} actionDispatcher={createActionDispatcher()} />,
	);
	await new Promise(resolve => setTimeout(resolve, 20));
	const frame = lastFrame();
	unmount();

	t.assert.ok(frame?.includes('Action "missing" failed'));
});
