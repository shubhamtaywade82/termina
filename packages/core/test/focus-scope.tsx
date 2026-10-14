import test, {type TestContext} from 'node:test';
import React, {useEffect} from 'react';
import {
	KeyboardCapture,
	Text,
	render,
	useFocus,
	useFocusManager,
	useFocusScope,
} from '../src/index.js';
import createStdout from './helpers/create-stdout.js';
import {createStdin, emitReadable} from './helpers/create-stdin.js';
import {act} from './helpers/act.js';

const tabInput = '\t';
const shiftTabInput = '\u{1B}[Z';

function Field({
	id,
	autoFocus = false,
}: {
	readonly id: string;
	readonly autoFocus?: boolean;
}) {
	const {isFocused} = useFocus({id, autoFocus});

	return <Text>{`${id}: ${isFocused ? 'focused' : 'blurred'}`}</Text>;
}

// Renders `tree(state)`. The returned helpers press keys, rerender with a new state, and read the focus manager after each commit.
async function renderFocus<State>(
	t: TestContext,
	initialState: State,
	tree: (state: State) => React.ReactElement,
) {
	const stdin = createStdin();
	let manager!: ReturnType<typeof useFocusManager>;

	function Probe() {
		manager = useFocusManager();
		return null;
	}

	const element = (state: State) => (
		<>
			{tree(state)}
			<Probe />
		</>
	);

	let instance!: ReturnType<typeof render>;
	await act(async () => {
		instance = render(element(initialState), {
			stdout: createStdout(),
			stdin,
			debug: true,
			concurrent: true,
			patchConsole: false,
		});
	});
	t.after(async () => {
		await act(async () => {
			instance.unmount();
		});
	});

	// Presses `input` `count` times, one commit per press, and returns the active ID after each.
	const press = async (input: string, count: number) => {
		const activeIds: Array<string | undefined> = [];

		for (let index = 0; index < count; index++) {
			// eslint-disable-next-line no-await-in-loop -- Each keypress must commit before reading the active ID.
			await act(async () => {
				emitReadable(stdin, input);
			});
			activeIds.push(manager.activeId);
		}

		return activeIds;
	};

	return {
		tab: async (count: number) => press(tabInput, count),
		shiftTab: async (count: number) => press(shiftTabInput, count),
		async rerender(state: State) {
			await act(async () => {
				instance.rerender(element(state));
			});
		},
		async focusById(id: string) {
			await act(async () => {
				manager.focus(id);
			});
		},
		get activeId() {
			return manager.activeId;
		},
	};
}

test('Tab cycles only through the focusables inside a KeyboardCapture', async (t: TestContext) => {
	const focus = await renderFocus<undefined>(t, undefined, () => (
		<>
			<Field id="outer-a" />
			<KeyboardCapture>
				<Field id="inner-a" />
				<Field id="inner-b" />
			</KeyboardCapture>
			<Field id="outer-b" />
		</>
	));

	t.assert.deepStrictEqual(await focus.tab(4), [
		'inner-a',
		'inner-b',
		'inner-a',
		'inner-b',
	]);
});

test('Shift+Tab cycles only through the focusables inside a KeyboardCapture', async (t: TestContext) => {
	const focus = await renderFocus<undefined>(t, undefined, () => (
		<>
			<Field id="outer-a" />
			<KeyboardCapture>
				<Field id="inner-a" />
				<Field id="inner-b" />
			</KeyboardCapture>
			<Field id="outer-b" />
		</>
	));

	t.assert.deepStrictEqual(await focus.shiftTab(3), [
		'inner-b',
		'inner-a',
		'inner-b',
	]);
});

test('Tab is a no-op while the KeyboardCapture has no focusables', async (t: TestContext) => {
	const focus = await renderFocus<undefined>(t, undefined, () => (
		<>
			<Field autoFocus id="outer-a" />
			<Field id="outer-b" />
			<KeyboardCapture>
				<Text>no focusables inside</Text>
			</KeyboardCapture>
		</>
	));

	t.assert.deepStrictEqual(await focus.tab(2), ['outer-a', 'outer-a']);
});

test('Tab returns to every focusable after the KeyboardCapture is released', async (t: TestContext) => {
	const focus = await renderFocus<boolean>(t, true, (active) => (
		<>
			<Field autoFocus id="outer-a" />
			<KeyboardCapture isActive={active}>
				<Field id="inner-a" />
				<Field id="inner-b" />
			</KeyboardCapture>
			<Field id="outer-b" />
		</>
	));

	t.assert.deepStrictEqual(await focus.tab(3), [
		'inner-a',
		'inner-b',
		'inner-a',
	]);

	await focus.rerender(false);

	// Focus stays on inner-a. The full list is outer-a, inner-a, inner-b, outer-b.
	t.assert.deepStrictEqual(await focus.tab(4), [
		'inner-b',
		'outer-b',
		'outer-a',
		'inner-a',
	]);
});

test('Tab stays in the innermost of nested KeyboardCaptures', async (t: TestContext) => {
	const focus = await renderFocus<undefined>(t, undefined, () => (
		<KeyboardCapture>
			<Field id="outer-a" />
			<KeyboardCapture>
				<Field id="inner-a" />
				<Field id="inner-b" />
			</KeyboardCapture>
			<Field id="outer-b" />
		</KeyboardCapture>
	));

	t.assert.deepStrictEqual(await focus.tab(3), [
		'inner-a',
		'inner-b',
		'inner-a',
	]);
});

test('a duplicate focus ID keeps its survivor after the other registration unmounts', async (t: TestContext) => {
	const focus = await renderFocus<boolean>(t, true, (showFirst) => (
		<>
			<Field id="a" />
			{showFirst && <Field id="x" />}
			<Field id="x" />
			<Field id="b" />
		</>
	));

	await focus.rerender(false);

	t.assert.deepStrictEqual(await focus.tab(3), ['a', 'x', 'b']);
});

test('removing one of two registrations that share the focused ID keeps that ID focused', async (t: TestContext) => {
	const focus = await renderFocus<boolean>(t, true, (showFirst) => (
		<>
			{showFirst && <Field id="x" />}
			<Field id="x" />
			<Field id="b" />
		</>
	));

	await focus.focusById('x');
	await focus.rerender(false);

	t.assert.strictEqual(focus.activeId, 'x');
});

test('focus can be restored to the element that was focused before a KeyboardCapture closed', async (t: TestContext) => {
	const focus = await renderFocus<boolean>(t, false, (open) => (
		<>
			<Field autoFocus id="outer-a" />
			{open && (
				<KeyboardCapture>
					<Field id="inner-a" />
				</KeyboardCapture>
			)}
		</>
	));

	const previousId = focus.activeId;
	await focus.rerender(true);
	t.assert.deepStrictEqual(await focus.tab(1), ['inner-a']);

	await focus.rerender(false);
	await focus.focusById(previousId ?? '');

	t.assert.strictEqual(focus.activeId, 'outer-a');
});

// Calls focusFirstInScope from an effect, after the focusables rendered inside it have registered.
function FocusFirstInScope({children}: {readonly children: React.ReactNode}) {
	const {focusFirstInScope} = useFocusScope();

	useEffect(() => {
		focusFirstInScope();
	}, [focusFirstInScope]);

	return <>{children}</>;
}

test('useFocusScope focuses the first focusable inside its KeyboardCapture', async (t: TestContext) => {
	const focus = await renderFocus<undefined>(t, undefined, () => (
		<>
			<Field autoFocus id="outer-a" />
			<KeyboardCapture>
				<FocusFirstInScope>
					<Field id="inner-a" />
					<Field id="inner-b" />
				</FocusFirstInScope>
			</KeyboardCapture>
		</>
	));

	t.assert.strictEqual(focus.activeId, 'inner-a');
	t.assert.deepStrictEqual(await focus.tab(1), ['inner-b']);
});

test('useFocusScope outside every KeyboardCapture focuses the first focusable that is not in one', async (t: TestContext) => {
	const focus = await renderFocus<undefined>(t, undefined, () => (
		<>
			<KeyboardCapture>
				<Field id="inner-a" />
			</KeyboardCapture>
			<FocusFirstInScope>
				<Field id="outer-a" />
				<Field id="outer-b" />
			</FocusFirstInScope>
		</>
	));

	t.assert.strictEqual(focus.activeId, 'outer-a');
});
