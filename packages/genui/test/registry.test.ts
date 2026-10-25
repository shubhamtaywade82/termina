import test, {type TestContext} from 'node:test';
import {z} from 'zod';
import {
	defineGenUIComponent,
	createGenUIRegistry,
	createDefaultRegistry,
} from '../source/registry.js';

test('defines a component and registers it', (t: TestContext) => {
	const customCard = defineGenUIComponent({
		name: 'CustomCard',
		description: 'A custom card component',
		schema: z.object({
			title: z.string(),
			count: z.number().optional(),
		}),
		render: () => null,
	});

	const registry = createGenUIRegistry([customCard]);
	t.assert.strictEqual(registry.has('CustomCard'), true);
	t.assert.strictEqual(registry.has('UnknownComp'), false);
	t.assert.strictEqual(registry.get('CustomCard')?.name, 'CustomCard');
});

test('throws on duplicate component registration', (t: TestContext) => {
	const first = defineGenUIComponent({
		name: 'Dup',
		description: 'First',
		schema: z.object({}),
		render: () => null,
	});
	const second = defineGenUIComponent({
		name: 'Dup',
		description: 'Second',
		schema: z.object({}),
		render: () => null,
	});

	t.assert.throws(
		() => createGenUIRegistry([first, second]),
		/Component "Dup" is already registered/,
	);
});

test('produces JSON Schema with component properties', (t: TestContext) => {
	const infoBox = defineGenUIComponent({
		name: 'InfoBox',
		description: 'An info box',
		schema: z.object({
			message: z.string(),
		}),
		render: () => null,
	});

	const registry = createGenUIRegistry([infoBox]);
	const schema = registry.toJSONSchema();
	t.assert.notStrictEqual(schema.properties, undefined);
	t.assert.notStrictEqual(schema.properties?.['InfoBox'], undefined);
});

test('default registry contains core Termina UI components', (t: TestContext) => {
	const defaultReg = createDefaultRegistry();
	const expected = [
		'Container',
		'Text',
		'Badge',
		'Alert',
		'StatusMessage',
		'ProgressBar',
		'LoadingBar',
		'CodeBlock',
		'Markdown',
		'Table',
		'Button',
		'TextInput',
		'Select',
	];

	for (const name of expected) {
		t.assert.strictEqual(
			defaultReg.has(name),
			true,
			`Missing expected component: ${name}`,
		);
	}
});
