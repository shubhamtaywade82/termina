import type { GenUIAction, GenUIActionDispatcher } from './types.js';

export class ActionNotFoundError extends Error {
	readonly actionName: string;

	constructor(actionName: string) {
		super(`Action "${actionName}" is not registered.`);
		this.name = 'ActionNotFoundError';
		this.actionName = actionName;
	}
}

export class ActionValidationError extends Error {
	readonly actionName: string;
	readonly validationError: string;

	constructor(actionName: string, validationError: string) {
		super(`Action "${actionName}" payload failed validation: ${validationError}`);
		this.name = 'ActionValidationError';
		this.actionName = actionName;
		this.validationError = validationError;
	}
}

export function createActionDispatcher(
	initialActions: readonly GenUIAction<any>[] = [],
): GenUIActionDispatcher {
	const actions = new Map<string, GenUIAction<any>>();

	function register<T>(action: GenUIAction<T>): void {
		if (actions.has(action.name)) {
			throw new Error(`Action "${action.name}" is already registered.`);
		}
		actions.set(action.name, action);
	}

	for (const action of initialActions) {
		register(action);
	}

	return {
		register,

		has(name: string): boolean {
			return actions.has(name);
		},

		async dispatch(name: string, payload: unknown): Promise<unknown> {
			const action = actions.get(name);
			if (!action) {
				throw new ActionNotFoundError(name);
			}

			const validation = action.schema.safeParse(payload);
			if (!validation.success) {
				const message = validation.error.issues[0]?.message ?? 'Validation failed';
				throw new ActionValidationError(name, message);
			}

			return action.handler(validation.data);
		},
	};
}
