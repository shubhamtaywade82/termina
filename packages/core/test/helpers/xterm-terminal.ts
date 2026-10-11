import EventEmitter from 'node:events';
import {PassThrough} from 'node:stream';
import headless from '@xterm/headless';
import delay from 'delay';
import {escapeFlushDelayMilliseconds} from '../../src/input-parser.js';

// A reflowing terminal model for resize tests. xterm.js, like the terminals Ink targets, reflows soft-wrapped rows when its column count changes, which the line-count reducer in `reconstruct-terminal.ts` cannot model. Output is translated the way a TTY with ONLCR does, so `\n` returns to column 0.

// One rendered cell of the viewport, with the style attributes tests assert on.
export type TerminalCell = {
	readonly char: string;
	readonly width: number;
	readonly bold: boolean;
	readonly dim: boolean;
	readonly inverse: boolean;
};

export type KeyName =
	| 'Tab'
	| 'Shift+Tab'
	| 'Enter'
	| 'Escape'
	| 'Backspace'
	| 'Delete'
	| 'Up'
	| 'Down'
	| 'Left'
	| 'Right'
	| 'Home'
	| 'End'
	| 'PageUp'
	| 'PageDown'
	| 'Ctrl+C';

// Legacy encodings, as a terminal without the kitty keyboard protocol sends them.
const keySequences: Record<KeyName, string> = {
	Tab: '\t',
	'Shift+Tab': '\u{1B}[Z',
	Enter: '\r',
	Escape: '\u{1B}',
	Backspace: '\u{7F}',
	Delete: '\u{1B}[3~',
	Up: '\u{1B}[A',
	Down: '\u{1B}[B',
	Right: '\u{1B}[C',
	Left: '\u{1B}[D',
	Home: '\u{1B}[H',
	End: '\u{1B}[F',
	PageUp: '\u{1B}[5~',
	PageDown: '\u{1B}[6~',
	'Ctrl+C': '\u{3}',
};

export type XtermTerminal = {
	stdout: NodeJS.WriteStream;
	stdin: NodeJS.ReadStream;
	// Resizes the terminal the way a window manager does: the emulator reflows first, then the application is told.
	resize: (columns: number, rows?: number) => Promise<void>;
	// Waits for queued writes, so the emulator has parsed everything Ink has written.
	settle: () => Promise<void>;
	// Scrollback and viewport of the active buffer, trailing blank rows removed.
	screen: () => string[];
	// One viewport row as text, 0 at the top of the visible rows. Trailing blanks are trimmed.
	getLine: (row: number) => string;
	// One viewport cell, or undefined outside the grid. The second column of a wide character reports an empty `char` with width 0.
	cellAt: (row: number, column: number) => TerminalCell | undefined;
	// The whole viewport as a row-major matrix of cells.
	cells: () => TerminalCell[][];
	// Writes a key the way a terminal sends it, then waits until the app has processed it. Escape waits out the app's flush window, since a lone ESC is held that long.
	emitKey: (key: KeyName) => Promise<void>;
	dispose: () => void;
};

const {Terminal} = headless;

// Only reached when `cells()` asks past the grid, which the loop bounds rule out. It keeps the matrix rectangular without a non-null assertion.
const emptyCell: TerminalCell = {
	char: '',
	width: 0,
	bold: false,
	dim: false,
	inverse: false,
};

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

	const viewportRow = (row: number): number => term.buffer.active.viewportY + row;

	const cellAt = (row: number, column: number): TerminalCell | undefined => {
		const cell = term.buffer.active.getLine(viewportRow(row))?.getCell(column);
		if (!cell) {
			return undefined;
		}

		return {
			char: cell.getChars(),
			width: cell.getWidth(),
			bold: cell.isBold() !== 0,
			dim: cell.isDim() !== 0,
			inverse: cell.isInverse() !== 0,
		};
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
		getLine: (row: number) => {
			const line = term.buffer.active.getLine(viewportRow(row));
			return line?.translateToString(true) ?? '';
		},
		cellAt,
		cells: () => {
			const matrix: TerminalCell[][] = [];
			for (let row = 0; row < term.rows; row++) {
				const cells: TerminalCell[] = [];
				for (let column = 0; column < term.cols; column++) {
					cells.push(cellAt(row, column) ?? emptyCell);
				}

				matrix.push(cells);
			}

			return matrix;
		},
		emitKey: async (key: KeyName) => {
			stdin.write(keySequences[key]);
			await delay(key === 'Escape' ? escapeFlushDelayMilliseconds + 30 : 30);
			await settle();
		},
		dispose: () => {
			term.dispose();
		},
	};
};
