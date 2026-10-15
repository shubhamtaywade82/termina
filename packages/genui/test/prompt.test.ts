import test, { type TestContext } from 'node:test';
import { z } from 'zod';
import { defineGenUIComponent, createGenUIRegistry, createDefaultRegistry } from '../source/registry.js';
import { generateGenUIPrompt } from '../source/prompt.js';

test('generates deterministic system instructions', (t: TestContext) => {
	const registry = createDefaultRegistry();
	const prompt1 = generateGenUIPrompt(registry);
	const prompt2 = generateGenUIPrompt(registry);

	t.assert.strictEqual(prompt1, prompt2);
	t.assert.ok(prompt1.includes('openui-lang'));
	t.assert.ok(prompt1.includes('root ='));
});

test('includes custom preamble and instructions', (t: TestContext) => {
	const registry = createDefaultRegistry();
	const prompt = generateGenUIPrompt(registry, {
		preamble: 'You are a Kubernetes terminal monitoring assistant.',
	});

	t.assert.ok(prompt.includes('You are a Kubernetes terminal monitoring assistant.'));
});

test('describes all registered components and their properties', (t: TestContext) => {
	const CustomWidget = defineGenUIComponent({
		name: 'WidgetX',
		description: 'A special telemetry widget',
		schema: z.object({
			metric: z.string(),
			value: z.number(),
		}),
		render: () => null,
	});

	const registry = createGenUIRegistry([CustomWidget]);
	const prompt = generateGenUIPrompt(registry);

	t.assert.ok(prompt.includes('WidgetX'));
	t.assert.ok(prompt.includes('metric'));
	t.assert.ok(prompt.includes('value'));
	t.assert.ok(!prompt.includes('Container'));
});

test('explains streaming rules and positional argument syntax', (t: TestContext) => {
	const registry = createDefaultRegistry();
	const prompt = generateGenUIPrompt(registry);

	t.assert.ok(prompt.includes('root =') || prompt.includes('root'));
	t.assert.ok(prompt.includes('positional') || prompt.includes('Positional') || prompt.includes('order matters'));
});
