import test, { type TestContext } from 'node:test';
import { z } from 'zod';
import { createGenUIRuntime } from '../source/runtime.js';

test('initializes with default values and reads them', (t: TestContext) => {
	const runtime = createGenUIRuntime({ username: 'alice', active: true });
	t.assert.strictEqual(runtime.getValue('username'), 'alice');
	t.assert.strictEqual(runtime.getValue('active'), true);
	t.assert.strictEqual(runtime.getValue('nonexistent'), undefined);
});

test('updates value and notifies subscribers', (t: TestContext) => {
	const runtime = createGenUIRuntime();
	let callCount = 0;

	const unsubscribe = runtime.subscribe(() => {
		callCount++;
	});

	runtime.setValue('age', 30);
	t.assert.strictEqual(runtime.getValue('age'), 30);
	t.assert.strictEqual(callCount, 1);

	unsubscribe();
	runtime.setValue('age', 31);
	t.assert.strictEqual(runtime.getValue('age'), 31);
	t.assert.strictEqual(callCount, 1);
});

test('returns a snapshot of all values', (t: TestContext) => {
	const runtime = createGenUIRuntime();
	runtime.setValue('search', 'termina');
	runtime.setValue('limit', 10);

	t.assert.deepStrictEqual(runtime.getValues(), {
		search: 'termina',
		limit: 10,
	});
});

test('resets runtime state to initial values', (t: TestContext) => {
	const runtime = createGenUIRuntime({ filter: 'default' });
	runtime.setValue('filter', 'modified');
	runtime.setValue('extra', 'temp');

	runtime.reset();
	t.assert.strictEqual(runtime.getValue('filter'), 'default');
	t.assert.strictEqual(runtime.getValue('extra'), undefined);
});

test('validates field value against schema', (t: TestContext) => {
	const runtime = createGenUIRuntime({ email: 'bad-email' });
	const schema = z.string().email();

	const res1 = runtime.validate('email', schema);
	t.assert.strictEqual(res1.success, false);
	t.assert.ok(res1.error);

	runtime.setValue('email', 'alice@example.com');
	const res2 = runtime.validate('email', schema);
	t.assert.strictEqual(res2.success, true);
	t.assert.strictEqual(res2.error, undefined);
});
