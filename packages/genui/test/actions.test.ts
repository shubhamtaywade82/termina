import test, {type TestContext} from 'node:test';
import {z} from 'zod';
import {
	createActionDispatcher,
	ActionNotFoundError,
	ActionValidationError,
} from '../source/actions.js';

test('registers and dispatches an action with validated input', async (t: TestContext) => {
	const dispatcher = createActionDispatcher();
	let dispatchedPayload: any = null;

	dispatcher.register({
		name: 'deploy_service',
		schema: z.object({
			serviceName: z.string(),
			replicas: z.number().int().min(1),
		}),
		handler(input) {
			dispatchedPayload = input;
			return {status: 'deployed'};
		},
	});

	t.assert.strictEqual(dispatcher.has('deploy_service'), true);

	const result = await dispatcher.dispatch('deploy_service', {
		serviceName: 'web-api',
		replicas: 3,
	});

	t.assert.deepStrictEqual(result, {status: 'deployed'});
	t.assert.deepStrictEqual(dispatchedPayload, {
		serviceName: 'web-api',
		replicas: 3,
	});
});

test('rejects unregistered actions with ActionNotFoundError', async (t: TestContext) => {
	const dispatcher = createActionDispatcher();

	await t.assert.rejects(
		async () => dispatcher.dispatch('unknown_action', {}),
		(error: Error) => {
			t.assert.ok(error instanceof ActionNotFoundError);
			t.assert.strictEqual(error.actionName, 'unknown_action');
			return true;
		},
	);
});

test('rejects invalid action payloads with ActionValidationError', async (t: TestContext) => {
	const dispatcher = createActionDispatcher();

	dispatcher.register({
		name: 'send_email',
		schema: z.object({
			recipient: z.email(),
		}),
		handler: () => 'sent',
	});

	await t.assert.rejects(
		async () => dispatcher.dispatch('send_email', {recipient: 'not-an-email'}),
		(error: Error) => {
			t.assert.ok(error instanceof ActionValidationError);
			t.assert.strictEqual(error.actionName, 'send_email');
			return true;
		},
	);
});

test('prevents overwriting or redefining existing action', (t: TestContext) => {
	const dispatcher = createActionDispatcher();

	dispatcher.register({
		name: 'action_1',
		schema: z.object({}),
		handler: () => null,
	});

	t.assert.throws(() => {
		dispatcher.register({
			name: 'action_1',
			schema: z.object({}),
			handler: () => null,
		});
	}, /Action "action_1" is already registered/);
});
