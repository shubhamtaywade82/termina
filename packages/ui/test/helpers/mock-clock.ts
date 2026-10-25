import {type TestContext} from 'node:test';

// Enables the mock clock for `setInterval`, then ticks zero. Ticking zero runs no timer, so the clock stays where it started.
export const enableIntervalClock = (t: TestContext): void => {
	t.mock.timers.enable({apis: ['setInterval']});
	t.mock.timers.tick(0);
};
