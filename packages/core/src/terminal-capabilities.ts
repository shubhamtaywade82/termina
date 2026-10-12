export type ColorLevel = 'none' | 'ansi16' | 'ansi256' | 'truecolor';

export type TerminalCapabilities = {
	// Whether Ink should render interactively. Mirrors the default of `render()`.
	readonly interactive: boolean;
	// Matches the level chalk selects, so raw styling and chalk agree.
	readonly colorLevel: ColorLevel;
	// DEC 2026 synchronized output. Unknown private modes are ignored by most terminals, but the Linux console is excluded because it has no documented behavior for them.
	readonly synchronizedOutput: boolean;
	readonly alternateScreen: boolean;
	readonly mouse: boolean;
	// OSC 8 hyperlinks. Written into a non-TTY stream they would appear as raw escape text in logs.
	readonly hyperlinks: boolean;
};

type Environment = Readonly<Record<string, string | undefined>>;

// Follows chalk's supports-color rules exactly, so raw styling and chalk always agree: an explicit FORCE_COLOR wins over NO_COLOR, TERM and the TTY check, an empty or "true" value means level 1, "false" means 0, and numbers are clamped to 0 to 3.
const forcedColorLevel = (forced: string): ColorLevel => {
	if (forced === 'false' || forced === '0') {
		return 'none';
	}

	if (forced === '' || forced === 'true') {
		return 'ansi16';
	}

	const level = Math.min(Number.parseInt(forced, 10) || 1, 3);
	return level >= 3 ? 'truecolor' : level === 2 ? 'ansi256' : 'ansi16';
};

const resolveColorLevel = (
	environment: Environment,
	isTty: boolean,
	isDumb: boolean,
): ColorLevel => {
	const forced = environment['FORCE_COLOR'];
	if (forced !== undefined) {
		return forcedColorLevel(forced);
	}

	// https://no-color.org: any non-empty value disables color.
	if (environment['NO_COLOR']) {
		return 'none';
	}

	if (!isTty || isDumb) {
		return 'none';
	}

	const colorTerm = environment['COLORTERM'];
	if (colorTerm === 'truecolor' || colorTerm === '24bit') {
		return 'truecolor';
	}

	if ((environment['TERM'] ?? '').includes('256color')) {
		return 'ansi256';
	}

	return 'ansi16';
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
