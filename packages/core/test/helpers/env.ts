import process from 'node:process';
import {type TestContext} from 'node:test';

// Sets environment variables for one test. `t.after` restores each one, even when an assertion throws, so a failure cannot leak into the next test.
export const setEnv = (
	t: TestContext,
	values: Record<string, string>,
): void => {
	const previous = new Map<string, string | undefined>();
	for (const [name, value] of Object.entries(values)) {
		previous.set(name, process.env[name]);
		process.env[name] = value;
	}

	t.after(() => {
		for (const [name, value] of previous) {
			if (value === undefined) {
				Reflect.deleteProperty(process.env, name);
			} else {
				process.env[name] = value;
			}
		}
	});
};
