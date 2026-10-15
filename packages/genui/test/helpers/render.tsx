import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { ReactNode } from 'react';
import { render as renderCore } from '@nemesis-oss/termina-core';

export function render(node: ReactNode) {
	const frames: string[] = [];
	const stdout = new EventEmitter() as EventEmitter & {
		isTTY: boolean;
		columns: number;
		rows: number;
		write: (data: string) => boolean;
	};
	// Terminal control sequences (bracketed paste, mouse tracking) are written
	// only to a TTY stdout. These tests render static frames, so a non-TTY
	// stdout matches the UI test helper convention and keeps lastFrame() a
	// rendered frame rather than a control sequence.
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
	stdin.isTTY = true;
	stdin.setRawMode = () => {};

	const instance = renderCore(node, {
		stdout: stdout as unknown as NodeJS.WriteStream,
		stdin: stdin as unknown as NodeJS.ReadStream,
		stderr: stdout as unknown as NodeJS.WriteStream,
		debug: true,
		patchConsole: false,
		exitOnCtrlC: false,
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
			isRecording = false;
			instance.unmount();
		},
	};
}
