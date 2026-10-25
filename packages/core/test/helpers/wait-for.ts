import delay from 'delay';

// Polls until `isMet` holds. Output is written by a throttled render, so a fixed delay is a guess that loses under load. A bounded poll waits as long as the render needs and still fails clearly when the condition never holds.
export const waitFor = async (
	isMet: () => boolean,
	description: string,
	timeoutMs = 3000,
): Promise<void> => {
	const deadline = Date.now() + timeoutMs;

	while (!isMet()) {
		if (Date.now() > deadline) {
			throw new Error(`Timed out waiting for ${description}`);
		}

		// eslint-disable-next-line no-await-in-loop
		await delay(5);
	}
};
