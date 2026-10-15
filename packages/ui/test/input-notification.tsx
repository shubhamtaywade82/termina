import test, {type TestContext} from 'node:test';
import React, {useState} from 'react';
import delay from 'delay';
import {
	EmailInput,
	MultiSelect,
	PasswordInput,
	Select,
	TextInput,
} from '../source/index.js';
import {render} from './helpers/render.js';

const enter = '\r';
const down = '\u{1B}[B';
const space = ' ';
const backspace = '\u{7F}';

// Parent updates are capped so a looping component fails the assertion instead of hanging the run.
const LOOP_LIMIT = 10;

type Harness = ReturnType<typeof render>;

// Types each key in its own write, letting the UI settle between keys.
const typeOneByOne = async (instance: Harness, keys: string[]) => {
	for (const key of keys) {
		instance.stdin.write(key);
		// eslint-disable-next-line no-await-in-loop -- Each key must reach the component before the next one is written.
		await delay(15);
	}

	await delay(20);
};

// Sends all keys in a single write, so they arrive in one stdin drain.
const typeAsBurst = async (instance: Harness, keys: string[]) => {
	instance.stdin.write(keys.join(''));
	await delay(40);
};

const textChanges = async (
	keys: string[],
	isBurst: boolean,
): Promise<string[]> => {
	const changes: string[] = [];
	const instance = render(
		<TextInput
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(20);
	if (isBurst) {
		await typeAsBurst(instance, keys);
	} else {
		await typeOneByOne(instance, keys);
	}

	instance.unmount();
	return changes;
};

test('TextInput: a burst reports one change per input event, in order', async (t: TestContext) => {
	// Typed one key at a time, each key is an event: a, ab, then a after Backspace. Sent as one chunk,
	// 'ab' arrives as one insert event, so the burst reports ab, then a.
	const keys = ['a', 'b', backspace];
	const sequential = await textChanges(keys, false);
	const burst = await textChanges(keys, true);

	t.assert.deepStrictEqual(sequential, ['a', 'ab', 'a']);
	t.assert.deepStrictEqual(burst, ['ab', 'a']);
});

test('TextInput: a burst that ends in Enter submits the value after the burst', async (t: TestContext) => {
	const submitted: string[] = [];
	const instance = render(
		<TextInput
			onSubmit={(value) => {
				submitted.push(value);
			}}
		/>,
	);

	await delay(20);
	await typeAsBurst(instance, ['a', 'b', backspace, enter]);
	instance.unmount();

	t.assert.deepStrictEqual(submitted, ['a']);
});

test('TextInput: re-rendering with a new inline onChange does not repeat the last change', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<TextInput
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(20);
	await typeOneByOne(instance, ['a']);
	instance.rerender(
		<TextInput
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);
	await delay(40);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['a']);
});

test('TextInput: a parent that stores each change does not loop', async (t: TestContext) => {
	const changes: string[] = [];

	function Form() {
		const [form, setForm] = useState({name: ''});
		return (
			<TextInput
				defaultValue={form.name}
				onChange={(value) => {
					changes.push(value);
					if (changes.length < LOOP_LIMIT) {
						setForm({name: value});
					}
				}}
			/>
		);
	}

	const instance = render(<Form />);
	await delay(20);
	await typeOneByOne(instance, ['a', 'b']);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['a', 'ab']);
});

test('PasswordInput: a burst reports one change per input event, in order', async (t: TestContext) => {
	const keys = ['a', 'b', backspace];
	const collect = async (isBurst: boolean) => {
		const changes: string[] = [];
		const instance = render(
			<PasswordInput
				onChange={(value) => {
					changes.push(value);
				}}
			/>,
		);

		await delay(20);
		if (isBurst) {
			await typeAsBurst(instance, keys);
		} else {
			await typeOneByOne(instance, keys);
		}

		instance.unmount();
		return changes;
	};

	const sequential = await collect(false);
	const burst = await collect(true);

	t.assert.deepStrictEqual(sequential, ['a', 'ab', 'a']);
	t.assert.deepStrictEqual(burst, ['ab', 'a']);
});

test('PasswordInput: a parent that stores each change does not loop', async (t: TestContext) => {
	const changes: string[] = [];

	function Form() {
		// eslint-disable-next-line @eslint-react/use-state -- The stored value is never read, so only the setter is named.
		const [, setForm] = useState({secret: ''});
		return (
			<PasswordInput
				onChange={(value) => {
					changes.push(value);
					if (changes.length < LOOP_LIMIT) {
						setForm({secret: value});
					}
				}}
			/>
		);
	}

	const instance = render(<Form />);
	await delay(20);
	await typeOneByOne(instance, ['a', 'b']);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['a', 'ab']);
});

test('EmailInput: a burst reports one change per input event, in order', async (t: TestContext) => {
	const keys = ['a', 'b', backspace];
	const collect = async (isBurst: boolean) => {
		const changes: string[] = [];
		const instance = render(
			<EmailInput
				onChange={(value) => {
					changes.push(value);
				}}
			/>,
		);

		await delay(20);
		if (isBurst) {
			await typeAsBurst(instance, keys);
		} else {
			await typeOneByOne(instance, keys);
		}

		instance.unmount();
		return changes;
	};

	const sequential = await collect(false);
	const burst = await collect(true);

	t.assert.deepStrictEqual(sequential, ['a', 'ab', 'a']);
	t.assert.deepStrictEqual(burst, ['ab', 'a']);
});

test('EmailInput: a parent that stores each change does not loop', async (t: TestContext) => {
	const changes: string[] = [];

	function Form() {
		const [form, setForm] = useState({email: ''});
		return (
			<EmailInput
				defaultValue={form.email}
				onChange={(value) => {
					changes.push(value);
					if (changes.length < LOOP_LIMIT) {
						setForm({email: value});
					}
				}}
			/>
		);
	}

	const instance = render(<Form />);
	await delay(20);
	await typeOneByOne(instance, ['a', 'b']);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['a', 'ab']);
});

const colors = [
	{label: 'Red', value: 'red'},
	{label: 'Green', value: 'green'},
	{label: 'Blue', value: 'blue'},
];

test('Select: re-rendering with equal options and a new inline onChange does not repeat the selection', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<Select
			options={colors}
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(20);
	await typeOneByOne(instance, [down, enter]);
	instance.rerender(
		<Select
			options={colors.map((option) => ({...option}))}
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);
	await delay(40);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['green']);
});

test('Select: a parent that stores each selection does not loop', async (t: TestContext) => {
	const changes: string[] = [];

	function Form() {
		const [form, setForm] = useState({color: ''});
		return (
			<Select
				options={colors.map((option) => ({...option}))}
				defaultValue={form.color}
				onChange={(value) => {
					changes.push(value);
					if (changes.length < LOOP_LIMIT) {
						setForm({color: value});
					}
				}}
			/>
		);
	}

	const instance = render(<Form />);
	await delay(20);
	await typeOneByOne(instance, [down, enter]);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['green']);
});

test('Select: resetting to different options does not call onChange', async (t: TestContext) => {
	const changes: string[] = [];
	const onChange = (value: string) => {
		changes.push(value);
	};

	const instance = render(<Select options={colors} onChange={onChange} />);

	await delay(20);
	await typeOneByOne(instance, [down, enter]);
	instance.rerender(
		<Select
			options={[
				{label: 'Cyan', value: 'cyan'},
				{label: 'Magenta', value: 'magenta'},
			]}
			onChange={onChange}
		/>,
	);
	await delay(40);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['green']);
});

const toppings = [
	{label: 'Cheese', value: 'cheese'},
	{label: 'Olive', value: 'olive'},
	{label: 'Basil', value: 'basil'},
];

test('MultiSelect: re-rendering with equal options and a new inline onChange does not repeat the selection', async (t: TestContext) => {
	const changes: string[][] = [];
	const instance = render(
		<MultiSelect
			options={toppings}
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(20);
	await typeOneByOne(instance, [space]);
	instance.rerender(
		<MultiSelect
			options={toppings.map((option) => ({...option}))}
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);
	await delay(40);
	instance.unmount();

	t.assert.deepStrictEqual(changes, [['cheese']]);
});

test('MultiSelect: a parent that copies the selection does not loop', async (t: TestContext) => {
	const changes: string[][] = [];

	function Form() {
		const [form, setForm] = useState({toppings: [] as string[]});
		return (
			<MultiSelect
				options={toppings.map((option) => ({...option}))}
				defaultValue={form.toppings}
				onChange={(value) => {
					changes.push(value);
					if (changes.length < LOOP_LIMIT) {
						setForm({toppings: [...value]});
					}
				}}
			/>
		);
	}

	const instance = render(<Form />);
	await delay(20);
	await typeOneByOne(instance, [space]);
	instance.unmount();

	t.assert.deepStrictEqual(changes, [['cheese']]);
});

test('MultiSelect: resetting to different options does not call onChange', async (t: TestContext) => {
	const changes: string[][] = [];
	const onChange = (value: string[]) => {
		changes.push(value);
	};

	const instance = render(
		<MultiSelect options={toppings} onChange={onChange} />,
	);

	await delay(20);
	await typeOneByOne(instance, [space]);
	instance.rerender(
		<MultiSelect
			options={[
				{label: 'Ham', value: 'ham'},
				{label: 'Pineapple', value: 'pineapple'},
			]}
			onChange={onChange}
		/>,
	);
	await delay(40);
	instance.unmount();

	t.assert.deepStrictEqual(changes, [['cheese']]);
});
