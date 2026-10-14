import React from 'react';
import test, { type TestContext } from 'node:test';
import { createDefaultRegistry } from '../source/registry.js';
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

	t.assert.ok(frame?.includes('v1.2.0'));
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
