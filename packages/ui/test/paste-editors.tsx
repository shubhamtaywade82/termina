import test, {type TestContext} from 'node:test';
import React from 'react';
import delay from 'delay';
import {usePaste} from '@nemesis-oss/termina-core';
import {PasswordInput, TextInput} from '../source/index.js';
import {render} from './helpers/render.js';

const pasteStart = '\u{1B}[200~';
const pasteEnd = '\u{1B}[201~';

// A sibling that mounts usePaste. While it is mounted, paste is delivered on the paste channel and never reaches useInput, so an editor takes paste through its own usePaste.
const PasteListener = ({
	onPaste,
}: {
	readonly onPaste: (text: string) => void;
}) => {
	usePaste(onPaste);
	return null;
};

test('TextInput takes a paste while a sibling usePaste is mounted', async (t: TestContext) => {
	let value: string | undefined;
	let siblingPaste: string | undefined;

	const {stdin} = render(
		<>
			<TextInput
				onChange={(next) => {
					value = next;
				}}
			/>
			<PasteListener
				onPaste={(text) => {
					siblingPaste = text;
				}}
			/>
		</>,
	);

	await delay(50);
	stdin.write(`${pasteStart}hello world${pasteEnd}`);
	await delay(50);

	t.assert.strictEqual(siblingPaste, 'hello world');
	t.assert.strictEqual(value, 'hello world');
});

test('PasswordInput takes a paste while a sibling usePaste is mounted', async (t: TestContext) => {
	let value: string | undefined;
	let siblingPaste: string | undefined;

	const {stdin} = render(
		<>
			<PasswordInput
				onChange={(next) => {
					value = next;
				}}
			/>
			<PasteListener
				onPaste={(text) => {
					siblingPaste = text;
				}}
			/>
		</>,
	);

	await delay(50);
	stdin.write(`${pasteStart}hello world${pasteEnd}`);
	await delay(50);

	t.assert.strictEqual(siblingPaste, 'hello world');
	t.assert.strictEqual(value, 'hello world');
});

test('TextInput drops newlines from a single-line paste', async (t: TestContext) => {
	let value: string | undefined;

	const {stdin} = render(
		<>
			<TextInput
				onChange={(next) => {
					value = next;
				}}
			/>
			<PasteListener onPaste={() => {}} />
		</>,
	);

	await delay(50);
	stdin.write(`${pasteStart}first\r\nsecond\n${pasteEnd}`);
	await delay(50);

	t.assert.strictEqual(value, 'firstsecond');
});

test('PasswordInput drops newlines from a single-line paste', async (t: TestContext) => {
	let value: string | undefined;

	const {stdin} = render(
		<>
			<PasswordInput
				onChange={(next) => {
					value = next;
				}}
			/>
			<PasteListener onPaste={() => {}} />
		</>,
	);

	await delay(50);
	stdin.write(`${pasteStart}first\r\nsecond\n${pasteEnd}`);
	await delay(50);

	t.assert.strictEqual(value, 'firstsecond');
});

test('a disabled TextInput takes no paste', async (t: TestContext) => {
	let value: string | undefined;
	let siblingPaste: string | undefined;

	const {stdin} = render(
		<>
			<TextInput
				isDisabled
				onChange={(next) => {
					value = next;
				}}
			/>
			<PasteListener
				onPaste={(text) => {
					siblingPaste = text;
				}}
			/>
		</>,
	);

	await delay(50);
	stdin.write(`${pasteStart}hello world${pasteEnd}`);
	await delay(50);

	t.assert.strictEqual(siblingPaste, 'hello world');
	t.assert.strictEqual(value, undefined);
});
