import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {type ReactNode} from 'react';
import {render as renderInk} from '@fork/core';

type Options = {
	readonly mouse?: boolean;
	// Piped stdin is not a TTY and has no setRawMode, as in CI.
	readonly isStdinPiped?: boolean;
};

// Mirrors the surface of ink-testing-library, on top of the forked core. `debug` writes each frame in full, so `lastFrame()` is the frame on screen and `frames` is every frame in order.
export const render = (node: ReactNode, {mouse = false, isStdinPiped = false}: Options = {}) => {
	const frames: string[] = [];
	const stdout = new EventEmitter() as EventEmitter & {
		isTTY: boolean;
		columns: number;
		rows: number;
		write: (data: string) => boolean;
	};
	stdout.isTTY = false;
	stdout.columns = 100;
	stdout.rows = 24;
	let isRecording = true;
	stdout.write = data => {
		if (isRecording) {
			frames.push(data);
		}

		return true;
	};

	const stdin = new PassThrough() as PassThrough & {
		isTTY: boolean;
		setRawMode: (mode: boolean) => void;
	};
	if (!isStdinPiped) {
		stdin.isTTY = true;
		stdin.setRawMode = () => {};
	}

	const instance = renderInk(node, {
		stdout: stdout as unknown as NodeJS.WriteStream,
		stdin: stdin as unknown as NodeJS.ReadStream,
		stderr: stdout as unknown as NodeJS.WriteStream,
		debug: true,
		patchConsole: false,
		exitOnCtrlC: false,
		mouse,
	});

	return {
		lastFrame: (): string | undefined => frames.at(-1),
		frames,
		stdin: {
			write: (data: string) => {
				stdin.write(data);
			},
		},
		rerender: (next: ReactNode) => {
			instance.rerender(next);
		},
		unmount: () => {
			// Ink writes its teardown frame on unmount. ink-testing-library does not record it, so stop recording first.
			isRecording = false;
			instance.unmount();
		},
	};
};

