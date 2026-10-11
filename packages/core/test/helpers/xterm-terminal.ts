import EventEmitter from 'node:events';
import {PassThrough} from 'node:stream';
import headless from '@xterm/headless';

// A reflowing terminal model for resize tests. xterm.js, like the terminals Ink targets, reflows soft-wrapped rows when its column count changes, which the line-count reducer in `reconstruct-terminal.ts` cannot model. Output is translated the way a TTY with ONLCR does, so `\n` returns to column 0.

export type XtermTerminal = {
	stdout: NodeJS.WriteStream;
	stdin: NodeJS.ReadStream;
	// Resizes the terminal the way a window manager does: the emulator reflows first, then the application is told.
	resize: (columns: number, rows?: number) => Promise<void>;
	// Waits for queued writes, so the emulator has parsed everything Ink has written.
	settle: () => Promise<void>;
	// Scrollback and viewport of the active buffer, trailing blank rows removed.
	screen: () => string[];
	dispose: () => void;
};

const {Terminal} = headless;

const flush = async (term: Terminal): Promise<void> =>
	new Promise<void>(resolve => {
		term.write('', resolve);
	});

export const createXtermTerminal = (
	columns: number,
	rows: number,
): XtermTerminal => {
	const term = new Terminal({
		cols: columns,
		rows,
		allowProposedApi: true,
		scrollback: 1000,
	});

	const stdout = new EventEmitter() as EventEmitter & {
		isTTY: boolean;
		columns: number;
		rows: number;
		write: (data: string, callback?: () => void) => boolean;
	};
	stdout.isTTY = true;
	stdout.columns = columns;
	stdout.rows = rows;
	stdout.write = (data, callback) => {
		term.write(data.replaceAll('\n', '\r\n'), () => {
			callback?.();
		});
		return true;
	};

	const stdin = new PassThrough() as PassThrough & {
		isTTY: boolean;
		setRawMode: (mode: boolean) => void;
	};
	stdin.isTTY = true;
	stdin.setRawMode = () => {};

	const settle = async () => {
		await new Promise(resolve => {
			setTimeout(resolve, 150);
		});
		await flush(term);
	};

	return {
		stdout: stdout as unknown as NodeJS.WriteStream,
		stdin: stdin as unknown as NodeJS.ReadStream,
		resize: async (nextColumns, nextRows = rows) => {
			term.resize(nextColumns, nextRows);
			stdout.columns = nextColumns;
			stdout.rows = nextRows;
			stdout.emit('resize');
			await settle();
		},
		settle,
		screen: () => {
			const buffer = term.buffer.active;
			const lines: string[] = [];
			for (let index = 0; index < buffer.length; index++) {
				lines.push(buffer.getLine(index)?.translateToString(true) ?? '');
			}

			while (lines.length > 0 && lines.at(-1) === '') {
				lines.pop();
			}

			return lines;
		},
		dispose: () => {
			term.dispose();
		},
	};
};
