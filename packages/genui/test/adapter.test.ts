import test, { type TestContext } from 'node:test';
import { z } from 'zod';
import { defineGenUIComponent, createGenUIRegistry } from '../source/registry.js';
import { createLanguageAdapter } from '../source/adapter.js';

const Box = defineGenUIComponent({
	name: 'Box',
	description: 'A layout box',
	schema: z.object({
		title: z.string(),
		children: z.array(z.any()).optional(),
	}),
	render: () => null,
});

const Label = defineGenUIComponent({
	name: 'Label',
	description: 'A text label',
	schema: z.object({
		text: z.string(),
	}),
	render: () => null,
});

const registry = createGenUIRegistry([Box, Label]);

test('parses a valid complete program to a GenUIElementNode tree', (t: TestContext) => {
	const adapter = createLanguageAdapter(registry);
	const code = `
root = Box("Header", [lbl])
lbl = Label("Active")
`;
	const result = adapter.parse(code);

	t.assert.strictEqual(result.isIncomplete, false);
	t.assert.strictEqual(result.errors.length, 0);
	t.assert.ok(result.root);
	t.assert.strictEqual(result.root.name, 'Box');
	t.assert.strictEqual(result.root.props['title'], 'Header');
	const children = result.root.props['children'] as any[];
	t.assert.strictEqual(children.length, 1);
	t.assert.strictEqual(children[0].name, 'Label');
	t.assert.strictEqual(children[0].props['text'], 'Active');
});

test('detects incomplete streaming input without treating as fatal error', (t: TestContext) => {
	const adapter = createLanguageAdapter(registry);
	const incompleteCode = 'root = Box("Head';
	const result = adapter.parseStreaming(incompleteCode);

	t.assert.strictEqual(result.isIncomplete, true);
	t.assert.strictEqual(result.errors.length, 0);
});

test('rejects unknown components with informative error', (t: TestContext) => {
	const adapter = createLanguageAdapter(registry);
	const badCode = 'root = UnknownWidget("test")';
	const result = adapter.parse(badCode);

	t.assert.ok(result.errors.length > 0);
	const err = result.errors.find(e => e.code.includes('unknown'));
	t.assert.ok(err, 'Should have unknown component error');
});

test('rejects type mismatches in properties', (t: TestContext) => {
	const adapter = createLanguageAdapter(registry);
	const badCode = 'root = Label(12345)';
	const result = adapter.parse(badCode);

	t.assert.ok(result.errors.length > 0);
	const err = result.errors.find(e => e.code.includes('type') || e.code.includes('mismatch'));
	t.assert.ok(err, 'Should report type mismatch error');
});

test('enforces maxStreamLength resource limit', (t: TestContext) => {
	const adapter = createLanguageAdapter(registry, { maxStreamLength: 20 });
	const longCode = 'root = Box("Very long text that definitely exceeds limit")';
	const result = adapter.parse(longCode);

	t.assert.ok(result.errors.some(e => e.code === 'resource-limit'));
	t.assert.strictEqual(result.root, null);
});

test('sanitizes terminal escape sequences in string props', (t: TestContext) => {
	const adapter = createLanguageAdapter(registry);
	const malicious = 'root = Label("Clean\u001B]0;Injected Title\u0007 Text")';
	const result = adapter.parse(malicious);

	t.assert.ok(result.root);
	t.assert.strictEqual(result.root.props['text'], 'Clean Text');
});
