import test, { type TestContext } from 'node:test';
import { z } from 'zod';
import { defineGenUIComponent, createGenUIRegistry } from '../source/registry.js';
import { createLanguageAdapter } from '../source/adapter.js';
import { createStreamCoordinator } from '../source/stream.js';

const Card = defineGenUIComponent({
	name: 'Card',
	description: 'Card component',
	schema: z.object({
		title: z.string(),
		children: z.array(z.any()).optional(),
	}),
	render: () => null,
});

const Item = defineGenUIComponent({
	name: 'Item',
	description: 'Item component',
	schema: z.object({
		name: z.string(),
	}),
	render: () => null,
});

const registry = createGenUIRegistry([Card, Item]);
const adapter = createLanguageAdapter(registry);

test('streaming character by character yields exact same final tree as one-shot parse', (t: TestContext) => {
	const code = `root = Card("Dashboard", [i1, i2])\ni1 = Item("First")\ni2 = Item("Second")\n`;
	const oneShot = adapter.parse(code);

	const coordinator = createStreamCoordinator(adapter);
	for (const char of code) {
		coordinator.append(char);
	}
	const finalUpdate = coordinator.complete();

	t.assert.strictEqual(finalUpdate.status, 'completed');
	t.assert.deepStrictEqual(finalUpdate.tree, oneShot.root);
});

test('exhaustive single-character step splits of short program produce consistent result', (t: TestContext) => {
	const code = 'root = Card("Title", [])\n';
	const expected = adapter.parse(code).root;

	for (let splitIndex = 1; splitIndex < code.length; splitIndex++) {
		const chunk1 = code.slice(0, splitIndex);
		const chunk2 = code.slice(splitIndex);

		const coordinator = createStreamCoordinator(adapter);
		coordinator.append(chunk1);
		coordinator.append(chunk2);
		const update = coordinator.complete();

		t.assert.deepStrictEqual(update.tree, expected, `Failed at split index ${splitIndex}`);
	}
});

test('streams with irregular chunk sizes', (t: TestContext) => {
	const code = `root = Card("App", [item])\nitem = Item("Active")\n`;
	const expected = adapter.parse(code).root;

	const chunkSizes = [1, 3, 5, 2, 7, 4];
	const coordinator = createStreamCoordinator(adapter);
	let offset = 0;
	let chunkIndex = 0;

	while (offset < code.length) {
		const size = chunkSizes[chunkIndex % chunkSizes.length]!;
		const chunk = code.slice(offset, offset + size);
		coordinator.append(chunk);
		offset += size;
		chunkIndex++;
	}

	const update = coordinator.complete();
	t.assert.deepStrictEqual(update.tree, expected);
});

test('notifies subscribers on each chunk update', (t: TestContext) => {
	const coordinator = createStreamCoordinator(adapter);
	const updates: string[] = [];

	const unsubscribe = coordinator.subscribe(update => {
		updates.push(update.rawText);
	});

	coordinator.append('root = Card(');
	coordinator.append('"Live")');
	coordinator.complete();

	t.assert.strictEqual(updates.length, 3);
	unsubscribe();
	coordinator.append('\n');
	t.assert.strictEqual(updates.length, 3);
});

test('preserves last valid tree when broken syntax is streamed', (t: TestContext) => {
	const coordinator = createStreamCoordinator(adapter);
	coordinator.append('root = Card("Valid", [])\n');
	const validTree = coordinator.getState().tree;
	t.assert.ok(validTree);

	// Append invalid syntax that fails to parse into a root
	coordinator.append('\n??? broken syntax ???');
	const state = coordinator.getState();
	t.assert.strictEqual(state.status, 'streaming');
	t.assert.deepStrictEqual(state.tree, validTree);
});
