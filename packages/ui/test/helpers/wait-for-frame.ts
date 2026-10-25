// React commits a state update in a later task. A fixed wait can end before the frame lands, as it did for the first update after mount in a cold process. The tests wait, bounded to one second, for the frame they expect, and then assert it.
export const waitForFrame = async (
	lastFrame: () => string | undefined,
	expected: string,
): Promise<void> => {
	await new Promise<void>((resolve) => {
		const deadline = Date.now() + 1000;
		const check = () => {
			if (lastFrame() === expected || Date.now() >= deadline) {
				resolve();
				return;
			}

			setTimeout(check, 1);
		};

		check();
	});
};
