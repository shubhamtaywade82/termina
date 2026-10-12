import type {ReactElement} from 'react';

// One rendered terminal frame shown on a docs page. `id` is the key a page uses in `<TerminalPreview id="..." />`, so it must be unique across every fixture module.
export type Preview = {
	readonly id: string;
	// Shown in the window's title bar, usually the source file or the state being shown.
	readonly title: string;
	// Width of the virtual terminal in columns. Defaults to 80.
	readonly columns?: number;
	// Optional sentence shown under the frame, describing what the reader is looking at.
	readonly caption?: string;
	readonly element: ReactElement;
};
