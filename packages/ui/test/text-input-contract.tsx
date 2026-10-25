import test, {type TestContext} from 'node:test';
import React, {useState} from 'react';
import chalk from 'chalk';
import delay from 'delay';
import {Text} from '@nemesis-oss/termina-core';
import {EmailInput, PasswordInput, TextInput} from '../source/index.js';
import {render} from './helpers/render.js';

const cursor = (character = ' ') => chalk.inverse(character);
const enter = '\r';
const arrowLeft = '\u{1B}[D';
const del = '\u{7F}';
const forwardDelete = '\u{1B}[3~';

const cursorAt = (input: string, at: number): string =>
	[...input]
		.map((character, index) => (index === at ? cursor(character) : character))
		.join('');

// The parent re-renders with a new inline callback each time, which is the
// case that re-notified consumers before the fix.
const TextHost = ({label, changes}: {label: string; changes: string[]}) => (
	<TextInput
		placeholder={label}
		onChange={(value) => {
			changes.push(value);
		}}
	/>
);

const PasswordHost = ({label, changes}: {label: string; changes: string[]}) => (
	<PasswordInput
		placeholder={label}
		onChange={(value) => {
			changes.push(value);
		}}
	/>
);

// A parent that echoes every change back, as a controlled consumer does.
const EchoingText = ({
	initial,
	onValue,
}: {
	initial: string;
	onValue: (value: string) => void;
}) => {
	const [value, setValue] = useState(initial);
	return (
		<TextInput
			value={value}
			onChange={(next) => {
				setValue(next);
				onValue(next);
			}}
		/>
	);
};

const EchoingPassword = ({
	initial,
	onValue,
}: {
	initial: string;
	onValue: (value: string) => void;
}) => {
	const [value, setValue] = useState(initial);
	return (
		<PasswordInput
			value={value}
			onChange={(next) => {
				setValue(next);
				onValue(next);
			}}
		/>
	);
};

test('TextInput: onChange fires once per edit when the parent re-renders with a new callback', async (t: TestContext) => {
	const changes: string[] = [];
	const {stdin, rerender, unmount} = render(
		<TextHost label="a" changes={changes} />,
	);

	await delay(50);
	stdin.write('x');
	await delay(50);
	t.assert.deepStrictEqual(changes, ['x']);

	rerender(<TextHost label="b" changes={changes} />);
	await delay(50);
	t.assert.deepStrictEqual(changes, ['x']);
	unmount();
});

test('TextInput: onChange does not fire for no-op edits', async (t: TestContext) => {
	const changes: string[] = [];
	const {stdin, unmount} = render(
		<TextInput
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write(del);
	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);
	t.assert.deepStrictEqual(changes, []);
	unmount();
});

test('TextInput: accepting a suggestion on enter notifies once, then submits the completed value', async (t: TestContext) => {
	const changes: string[] = [];
	const submitted: string[] = [];
	const {stdin, unmount} = render(
		<TextInput
			defaultValue="dep"
			suggestions={['deploy']}
			onChange={(value) => {
				changes.push(value);
			}}
			onSubmit={(value) => {
				submitted.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write(enter);
	await delay(50);
	t.assert.deepStrictEqual(changes, ['deploy']);
	t.assert.deepStrictEqual(submitted, ['deploy']);
	unmount();
});

test('TextInput controlled: a rejected edit leaves the displayed value to the parent', async (t: TestContext) => {
	const proposed: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<TextInput
			value="abc"
			onChange={(value) => {
				proposed.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write('d');
	await delay(50);

	t.assert.deepStrictEqual(proposed, ['abcd']);
	t.assert.strictEqual(lastFrame(), `abc${cursor()}`);
	unmount();
});

test('TextInput controlled: an echoed edit keeps the cursor where the user put it', async (t: TestContext) => {
	const values: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<EchoingText
			initial="ab"
			onValue={(value) => {
				values.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);
	stdin.write('X');
	await delay(50);

	t.assert.deepStrictEqual(values, ['aXb']);
	t.assert.strictEqual(lastFrame(), cursorAt('aXb', 2));
	unmount();
});

// The caret keeps its offset when the parent changes the value, clamped to the new length. It moves only when the user edits or moves it.
test('TextInput controlled: an external value change keeps the cursor offset, clamped to the new value', async (t: TestContext) => {
	const {lastFrame, stdin, rerender, unmount} = render(
		<TextInput value="abc" />,
	);

	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);

	rerender(<TextInput value="world!" />);
	await delay(50);
	t.assert.strictEqual(lastFrame(), cursorAt('world!', 1));
	unmount();
});

test('TextInput controlled: a parent re-render with a new callback does not re-notify', async (t: TestContext) => {
	const changes: string[] = [];
	const {rerender, unmount} = render(
		<TextInput
			value="ab"
			placeholder="a"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	rerender(
		<TextInput
			value="ab"
			placeholder="b"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);
	await delay(50);
	t.assert.deepStrictEqual(changes, []);
	unmount();
});

test('TextInput controlled: onSubmit receives the value prop', async (t: TestContext) => {
	const submitted: string[] = [];
	const {stdin, unmount} = render(
		<TextInput
			value="deploy"
			onSubmit={(value) => {
				submitted.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write(enter);
	await delay(50);
	t.assert.deepStrictEqual(submitted, ['deploy']);
	unmount();
});

test('PasswordInput: onChange fires once per edit when the parent re-renders with a new callback', async (t: TestContext) => {
	const changes: string[] = [];
	const {stdin, rerender, unmount} = render(
		<PasswordHost label="a" changes={changes} />,
	);

	await delay(50);
	stdin.write('x');
	await delay(50);
	t.assert.deepStrictEqual(changes, ['x']);

	rerender(<PasswordHost label="b" changes={changes} />);
	await delay(50);
	t.assert.deepStrictEqual(changes, ['x']);
	unmount();
});

test('PasswordInput uncontrolled: defaultValue seeds the masked value', (t: TestContext) => {
	const {lastFrame, unmount} = render(<PasswordInput defaultValue="ab" />);

	t.assert.strictEqual(lastFrame(), `**${cursor()}`);
	unmount();
});

test('PasswordInput controlled: edits report the proposed value and the parent decides', async (t: TestContext) => {
	const proposed: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<PasswordInput
			value="ab"
			onChange={(value) => {
				proposed.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write('c');
	await delay(50);

	t.assert.deepStrictEqual(proposed, ['abc']);
	t.assert.strictEqual(lastFrame(), `**${cursor()}`);
	unmount();
});

test('PasswordInput controlled: an echoed edit keeps the cursor where the user put it', async (t: TestContext) => {
	const values: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<EchoingPassword
			initial="ab"
			onValue={(value) => {
				values.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);
	stdin.write('X');
	await delay(50);

	t.assert.deepStrictEqual(values, ['aXb']);
	t.assert.strictEqual(lastFrame(), `**${cursor('*')}`);
	unmount();
});

test('PasswordInput controlled: onSubmit receives the value prop', async (t: TestContext) => {
	const submitted: string[] = [];
	const {stdin, unmount} = render(
		<PasswordInput
			value="secret"
			onSubmit={(value) => {
				submitted.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write(enter);
	await delay(50);
	t.assert.deepStrictEqual(submitted, ['secret']);
	unmount();
});

test('TextInput: a paste arrives as one edit and notifies once', async (t: TestContext) => {
	const changes: string[] = [];
	const {stdin, unmount} = render(
		<TextInput
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write('Test');
	await delay(50);
	t.assert.deepStrictEqual(changes, ['Test']);
	unmount();
});

test('TextInput controlled: accepting a suggestion notifies once with the completed value, then submits it', async (t: TestContext) => {
	const changes: string[] = [];
	const submitted: string[] = [];
	const Harness = () => {
		const [value, setValue] = useState('dep');
		return (
			<TextInput
				value={value}
				suggestions={['deploy']}
				onChange={(next) => {
					changes.push(next);
					setValue(next);
				}}
				onSubmit={(next) => {
					submitted.push(next);
				}}
			/>
		);
	};

	const {stdin, unmount} = render(<Harness />);

	await delay(50);
	stdin.write(enter);
	await delay(50);
	t.assert.deepStrictEqual(changes, ['deploy']);
	t.assert.deepStrictEqual(submitted, ['deploy']);
	unmount();
});

test('PasswordInput controlled: an external value change keeps the cursor offset, clamped to the new value', async (t: TestContext) => {
	const {lastFrame, stdin, rerender, unmount} = render(
		<PasswordInput value="abc" />,
	);

	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);

	rerender(<PasswordInput value="wxyz" />);
	await delay(50);
	t.assert.strictEqual(lastFrame(), cursorAt('****', 2));
	unmount();
});

test('EmailInput: onChange fires once per edit when the parent re-renders with a new callback', async (t: TestContext) => {
	const changes: string[] = [];
	const EmailHost = ({label}: {label: string}) => (
		<EmailInput
			placeholder={label}
			onChange={(value) => {
				changes.push(value);
			}}
		/>
	);
	const {stdin, rerender, unmount} = render(<EmailHost label="a" />);

	await delay(50);
	stdin.write('x');
	await delay(50);
	t.assert.deepStrictEqual(changes, ['x']);

	rerender(<EmailHost label="b" />);
	await delay(50);
	t.assert.deepStrictEqual(changes, ['x']);
	unmount();
});

test('EmailInput: mounting with a default value does not notify', async (t: TestContext) => {
	const changes: string[] = [];
	const {unmount} = render(
		<EmailInput
			defaultValue="ada@"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	t.assert.deepStrictEqual(changes, []);
	unmount();
});

test('TextInput: edits go to the onChange from the latest render', async (t: TestContext) => {
	const first: string[] = [];
	const second: string[] = [];
	const {stdin, rerender, unmount} = render(
		<TextInput
			placeholder="a"
			onChange={(value) => {
				first.push(value);
			}}
		/>,
	);

	await delay(50);
	rerender(
		<TextInput
			placeholder="b"
			onChange={(value) => {
				second.push(value);
			}}
		/>,
	);
	await delay(50);
	stdin.write('x');
	await delay(50);

	t.assert.deepStrictEqual(first, []);
	t.assert.deepStrictEqual(second, ['x']);
	unmount();
});

test('TextInput: moving the cursor does not notify', async (t: TestContext) => {
	const changes: string[] = [];
	const {stdin, unmount} = render(
		<TextInput
			defaultValue="ab"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);
	t.assert.deepStrictEqual(changes, []);
	unmount();
});

test('TextInput: Backspace in the middle of the value deletes the character before the cursor', async (t: TestContext) => {
	const changes: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<TextInput
			defaultValue="abc"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);
	stdin.write(del);
	await delay(50);

	t.assert.deepStrictEqual(changes, ['ac']);
	t.assert.strictEqual(lastFrame(), cursorAt('ac', 1));
	unmount();
});

test('TextInput: forward Delete in the middle of the value deletes the character after the cursor', async (t: TestContext) => {
	const changes: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<TextInput
			defaultValue="abc"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);
	stdin.write(forwardDelete);
	await delay(50);

	t.assert.deepStrictEqual(changes, ['ac']);
	t.assert.strictEqual(lastFrame(), cursorAt('ac', 1));
	unmount();
});

// A value the parent adopts after refusing the edit leaves the caret where the user left it. The caret never follows a value the user did not type.
test('TextInput controlled: a rejected value is not notified again when the parent later adopts it', async (t: TestContext) => {
	const proposed: string[] = [];
	const {lastFrame, stdin, rerender, unmount} = render(
		<TextInput
			value="ab"
			onChange={(value) => {
				proposed.push(value);
			}}
		/>,
	);

	await delay(50);
	stdin.write('x');
	await delay(50);
	t.assert.deepStrictEqual(proposed, ['abx']);

	rerender(
		<TextInput
			value="abx"
			onChange={(value) => {
				proposed.push(value);
			}}
		/>,
	);
	await delay(50);
	t.assert.deepStrictEqual(proposed, ['abx']);
	t.assert.strictEqual(lastFrame(), cursorAt('abx', 2));
	unmount();
});

test('TextInput controlled: a value cleared by the parent is adopted, and typing starts from it', async (t: TestContext) => {
	const proposed: string[] = [];
	const {lastFrame, stdin, rerender, unmount} = render(
		<TextInput
			value="abc"
			onChange={(value) => {
				proposed.push(value);
			}}
		/>,
	);

	await delay(50);
	rerender(
		<TextInput
			value=""
			onChange={(value) => {
				proposed.push(value);
			}}
		/>,
	);
	await delay(50);
	t.assert.strictEqual(lastFrame(), cursor());

	stdin.write('q');
	await delay(50);
	t.assert.deepStrictEqual(proposed, ['q']);
	unmount();
});

class Boundary extends React.Component<
	{
		readonly children: React.ReactNode;
		readonly onError: (error: unknown) => void;
	},
	{readonly failed: boolean}
> {
	static getDerivedStateFromError() {
		return {failed: true};
	}

	override state = {failed: false};

	override componentDidCatch(error: unknown) {
		this.props.onError(error);
	}

	// ReactNode includes Promise in its type, but render returns an element or the children.
	// eslint-disable-next-line @typescript-eslint/promise-function-async -- ReactNode includes Promise in its type.
	override render() {
		return this.state.failed ? <Text>boundary</Text> : this.props.children;
	}
}

test('PasswordInput: an error thrown by onChange reaches the nearest error boundary', async (t: TestContext) => {
	const caught: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<Boundary
			onError={(error) => {
				caught.push(error instanceof Error ? error.message : String(error));
			}}
		>
			<PasswordInput
				onChange={() => {
					throw new Error('boom');
				}}
			/>
		</Boundary>,
	);

	await delay(50);
	stdin.write('x');
	await delay(50);

	t.assert.deepStrictEqual(caught, ['boom']);
	t.assert.ok((lastFrame() ?? '').includes('boundary'));
	unmount();
});

test('EmailInput: an error thrown by onChange reaches the nearest error boundary', async (t: TestContext) => {
	const caught: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<Boundary
			onError={(error) => {
				caught.push(error instanceof Error ? error.message : String(error));
			}}
		>
			<EmailInput
				onChange={() => {
					throw new Error('boom');
				}}
			/>
		</Boundary>,
	);

	await delay(50);
	stdin.write('x');
	await delay(50);

	t.assert.deepStrictEqual(caught, ['boom']);
	t.assert.ok((lastFrame() ?? '').includes('boundary'));
	unmount();
});

test('TextInput: an error thrown by onChange reaches the nearest error boundary', async (t: TestContext) => {
	const caught: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<Boundary
			onError={(error) => {
				caught.push(error instanceof Error ? error.message : String(error));
			}}
		>
			<TextInput
				onChange={() => {
					throw new Error('boom');
				}}
			/>
		</Boundary>,
	);

	await delay(50);
	stdin.write('x');
	await delay(50);

	t.assert.deepStrictEqual(caught, ['boom']);
	t.assert.ok((lastFrame() ?? '').includes('boundary'));
	unmount();
});
