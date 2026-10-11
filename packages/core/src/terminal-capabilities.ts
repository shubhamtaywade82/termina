export type ColorLevel = 'none' | 'ansi16' | 'ansi256' | 'truecolor';

export type TerminalCapabilities = {
	// Whether Ink should render interactively. Mirrors the default of `render()`.
	readonly interactive: boolean;
	// Matches the level chalk selects, including FORCE_COLOR levels, so raw styling and chalk agree. Only NO_COLOR differs.
	readonly colorLevel: ColorLevel;
	// DEC 2026 synchronized output. Unknown private modes are ignored by most terminals, but the Linux console is excluded because it has no documented behavior for them.
	readonly synchronizedOutput: boolean;
	readonly alternateScreen: boolean;
	readonly mouse: boolean;
	// OSC 8 hyperlinks. Written into a non-TTY stream they would appear as raw escape text in logs.
	readonly hyperlinks: boolean;
};

type Environment = Readonly<Record<string, string | undefined>>;

const colorLevels: readonly ColorLevel[] = ['none', 'ansi16', 'ansi256', 'truecolor'];

// Same parsing as chalk's supports-color: "true" or empty means basic color, "false" means none, and a number is capped at truecolor.
const parseForcedLevel = (value: string | undefined): number | undefined => {
	if (value === undefined) {
		return undefined;
	}

	if (value === 'false') {
		return 0;
	}

	const level = Number.parseInt(value, 10);
	return Number.isNaN(level) ? 1 : Math.min(Math.max(level, 0), 3);
};

const detectColorLevel = (environment: Environment): number => {
	const colorTerm = environment['COLORTERM'];
	if (colorTerm === 'truecolor' || colorTerm === '24bit') {
		return 3;
	}

	return (environment['TERM'] ?? '').includes('256color') ? 2 : 1;
};

const resolveColorLevel = (
	environment: Environment,
	isTty: boolean,
	isDumb: boolean,
): ColorLevel => {
	// https://no-color.org: any non-empty value disables color. chalk ignores NO_COLOR; here it wins over FORCE_COLOR.
	if (environment['NO_COLOR']) {
		return 'none';
	}

	const forcedLevel = parseForcedLevel(environment['FORCE_COLOR']);
	if (forcedLevel === 0) {
		return 'none';
	}

	if (isDumb) {
		return colorLevels[forcedLevel ?? 0]!;
	}

	if (!isTty && forcedLevel === undefined) {
		return 'none';
	}

	return colorLevels[Math.max(forcedLevel ?? 0, detectColorLevel(environment))]!;
};

/**
Probes the environment once. Callers pick the features they need from the result, so a basic console, a dumb terminal, a CI log, and an IDE pane each get the output they can actually display.
*/
export const detectTerminalCapabilities = (
	environment: Environment,
	stream: {readonly isTTY?: boolean},
	inCi = Boolean(environment['CI']),
): TerminalCapabilities => {
	const term = environment['TERM'] ?? '';
	const isTty = stream.isTTY === true;
	const isDumb = term === 'dumb';
	const isLinuxConsole = term === 'linux';
	const interactive = isTty && !isDumb && !inCi;

	return {
		interactive,
		colorLevel: resolveColorLevel(environment, isTty, isDumb),
		synchronizedOutput: interactive && !isLinuxConsole,
		alternateScreen: interactive,
		mouse: interactive,
		hyperlinks: isTty && !isDumb && !isLinuxConsole,
	};
};
