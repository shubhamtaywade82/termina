import test, {type TestContext} from 'node:test';
import React, {useEffect, useLayoutEffect, useState} from 'react';
import {render, Static, Text, Box, useApp} from '../src/index.js';
import createStdout from './helpers/create-stdout.js';

// Non-interactive output is what CI and piped stdout get: <Static> items are written
// as they commit, and the final frame is written on unmount. Each <Static> item must
// reach stdout exactly once, however unmount is reached.
const renderNonInteractive = async (
	element: React.ReactElement,
	options: {readonly maxFps?: number} = {},
): Promise<string> => {
	const stdout = createStdout(80, false);
	const instance = render(element, {
		stdout,
		stderr: stdout,
		interactive: false,
		patchConsole: false,
		...options,
	});
	await instance.waitUntilExit();
	return stdout.getWrites().join('');
};

const renderStatic = (items: string[]) => (
	<Static items={items}>{(item) => <Text key={item}>{item}</Text>}</Static>
);

// The commit that adds <Static> items is followed by a layout effect that calls exit().
// React only drops the committed items after that effect, so unmount runs while they are still rendered.
function ExitFromLayoutEffect({items}: {readonly items: string[]}) {
	const {exit} = useApp();

	useLayoutEffect(() => {
		exit();
	}, [exit]);

	return (
		<Box flexDirection="column">
			{renderStatic(items)}
			<Text>live</Text>
		</Box>
	);
}

function ExitFromPassiveEffect({items}: {readonly items: string[]}) {
	const {exit} = useApp();

	useEffect(() => {
		exit();
	}, [exit]);

	return (
		<Box flexDirection="column">
			{renderStatic(items)}
			<Text>live</Text>
		</Box>
	);
}

test('non-interactive unmount inside a layout effect writes static items once', async (t: TestContext) => {
	const output = await renderNonInteractive(
		<ExitFromLayoutEffect items={['A', 'B']} />,
	);

	t.assert.strictEqual(output, 'A\nB\nlive\n');
});

test('non-interactive unmount inside a passive effect writes static items once', async (t: TestContext) => {
	const output = await renderNonInteractive(
		<ExitFromPassiveEffect items={['A', 'B']} />,
	);

	t.assert.strictEqual(output, 'A\nB\nlive\n');
});

test('non-interactive unmount in the commit that appends static items writes only the new items once', async (t: TestContext) => {
	function App() {
		const {exit} = useApp();
		const [items, setItems] = useState(['A']);

		useEffect(() => {
			const timer = setTimeout(() => {
				setItems(['A', 'B', 'C']);
			}, 1);
			return () => {
				clearTimeout(timer);
			};
		}, []);

		useLayoutEffect(() => {
			if (items.length > 1) {
				exit();
			}
		}, [items.length, exit]);

		return (
			<Box flexDirection="column">
				{renderStatic(items)}
				<Text>live</Text>
			</Box>
		);
	}

	const output = await renderNonInteractive(<App />);

	t.assert.strictEqual(output, 'A\nB\nC\nlive\n');
});

test('non-interactive unmount with a queued throttled render writes static items once', async (t: TestContext) => {
	function App() {
		const {exit} = useApp();
		const [live, setLive] = useState(0);
		const [items, setItems] = useState<string[]>([]);

		useEffect(() => {
			// The first two live updates leave a trailing throttled render queued. The static commit
			// then renders immediately, and the queued render still runs during unmount.
			const firstLive = setTimeout(() => {
				setLive(1);
			}, 1);
			const secondLive = setTimeout(() => {
				setLive(2);
			}, 2);
			const staticItems = setTimeout(() => {
				setItems(['A', 'B']);
			}, 3);
			return () => {
				clearTimeout(firstLive);
				clearTimeout(secondLive);
				clearTimeout(staticItems);
			};
		}, []);

		useLayoutEffect(() => {
			if (items.length > 0) {
				exit();
			}
		}, [items.length, exit]);

		return (
			<Box flexDirection="column">
				{renderStatic(items)}
				<Text>{`live ${live}`}</Text>
			</Box>
		);
	}

	const output = await renderNonInteractive(<App />, {maxFps: 5});

	t.assert.strictEqual(output, 'A\nB\nlive 2\n');
});

test('non-interactive unmount without exit still writes static items once', async (t: TestContext) => {
	const stdout = createStdout(80, false);
	const instance = render(renderStatic(['A']), {
		stdout,
		stderr: stdout,
		interactive: false,
		patchConsole: false,
	});

	instance.rerender(renderStatic(['A', 'B']));
	await instance.waitUntilRenderFlush();
	instance.unmount();
	await instance.waitUntilExit();

	t.assert.strictEqual(stdout.getWrites().join(''), 'A\nB\n\n');
});
