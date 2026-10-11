// The turn is pure data plus a pure reducer. Every panel reads the same state, so the wire log, transcript, context and timeline cannot disagree about what happened.

export type Phase = 'idle' | 'reason' | 'act' | 'observe' | 'respond' | 'done';
export const phases: readonly Phase[] = ['idle', 'reason', 'act', 'observe', 'respond', 'done'];

export type BlockKind = 'thinking' | 'tool' | 'text';

export type Block = {
	readonly id: number;
	readonly kind: BlockKind;
	readonly phase: Phase;
	readonly title: string;
	readonly startedAt: number;
	text: string;
	done: boolean;
	endedAt: number;
	tokens: number;
};

export type WireKind = 'srv' | 'dlt' | 'tool' | 'sys';
export type WireLine = {readonly kind: WireKind; readonly label: string};
export type Segment = {readonly kind: BlockKind; readonly startMs: number; readonly endMs: number};
export type Context = {system: number; memory: number; history: number; thinking: number; tools: number; text: number};

export type TurnState = {
	readonly now: number;
	readonly speed: number;
	readonly paused: boolean;
	readonly running: boolean;
	readonly phase: Phase;
	readonly iteration: number;
	readonly blocks: readonly Block[];
	readonly wire: readonly WireLine[];
	readonly segments: readonly Segment[];
	readonly context: Readonly<Context>;
	readonly inputTokens: number;
	readonly outputTokens: number;
	readonly firstTokenMs: number | undefined;
	readonly scriptIndex: number;
};

export type ScriptAction =
	| {type: 'message_start'; inputTokens: number}
	| {type: 'phase'; phase: Phase}
	| {type: 'block_start'; id: number; kind: BlockKind; title: string; phase: Phase}
	| {type: 'delta'; id: number; text: string}
	| {type: 'tool_exec'; id: number}
	| {type: 'tool_output'; id: number; text: string}
	| {type: 'block_stop'; id: number}
	| {type: 'subagent'; name: string}
	| {type: 'message_stop'};

export type TurnAction =
	| {type: 'advance'; dt: number}
	| {type: 'set_speed'; speed: number}
	| {type: 'toggle_pause'}
	| {type: 'restart'};

type Step = {readonly at: number; readonly action: ScriptAction};

const buildScript = (): Step[] => {
	const steps: Step[] = [];
	let clock = 0;
	let nextId = 0;
	const add = (dt: number, action: ScriptAction): void => {
		clock += dt;
		steps.push({at: clock, action});
	};

	const streamBlock = (kind: BlockKind, title: string, phase: Phase, text: string, perWord: number, after: number): void => {
		const id = nextId++;
		add(0, {type: 'block_start', id, kind, title, phase});
		for (const word of text.split(' ')) {
			add(perWord, {type: 'delta', id, text: `${word} `});
		}

		add(after, {type: 'block_stop', id});
	};

	const toolBlock = (title: string, output: string, ms: number, after: number): void => {
		const id = nextId++;
		add(0, {type: 'block_start', id, kind: 'tool', title, phase: 'act'});
		add(150, {type: 'tool_exec', id});
		add(ms, {type: 'tool_output', id, text: output});
		add(after, {type: 'block_stop', id});
	};

	add(0, {type: 'message_start', inputTokens: 4820});
	add(400, {type: 'phase', phase: 'reason'});
	streamBlock('thinking', 'thinking', 'reason',
		'Request has three parts: security audit, rate limiting, tests. Checking memory: CLAUDE.md says validate with zod. Plan: read auth.ts first, then delegate the crypto audit to a security-audit subagent.', 70, 200);
	add(0, {type: 'phase', phase: 'act'});
	toolBlock('Read src/auth.ts',
		'export async function auth(req) {\n  const token = req.headers.authorization;  // no Bearer split\n  const decoded = await verifyToken(token); // === compare\n  return decoded;                           // no error path\n}', 700, 0);
	add(0, {type: 'phase', phase: 'observe'});
	add(300, {type: 'phase', phase: 'reason'});
	streamBlock('thinking', 'thinking', 'reason',
		'Three issues: raw header without Bearer split, non-constant-time token compare, no failure branch. Grep the blast radius next.', 65, 200);
	add(0, {type: 'phase', phase: 'act'});
	toolBlock('Grep "authorization" -t ts', '5 matches in 4 files\nsrc/auth.ts:5  src/middleware.ts:22  src/routes/api.ts:41', 520, 0);
	add(0, {type: 'phase', phase: 'observe'});
	add(300, {type: 'phase', phase: 'act'});
	add(0, {type: 'subagent', name: 'security-audit'});
	toolBlock('Task security-audit', 'subagent → 2 findings: timing attack, missing timingSafeEqual · 3,140 tok merged', 800, 0);
	add(0, {type: 'phase', phase: 'reason'});
	streamBlock('thinking', 'thinking', 'reason',
		'Writing the fix: Bearer split, timingSafeEqual, explicit 401, rate limit 5 per minute per IP. Then run the tests.', 60, 200);
	add(0, {type: 'phase', phase: 'act'});
	toolBlock('Edit src/auth.ts (+14 −6)', '✓ applied · typecheck ✓', 700, 0);
	toolBlock('Bash npm test -- --coverage', 'Tests: 31 passed, 31 total · coverage 96.1%', 1200, 0);
	add(0, {type: 'phase', phase: 'observe'});
	add(250, {type: 'phase', phase: 'respond'});
	streamBlock('text', 'answer', 'respond',
		'Audit complete: 2 vulnerabilities fixed, 7 tests added. Timing attack fixed with timingSafeEqual. /api/login is rate limited to 5 per minute per IP. Bearer parsing hardened. All 31 tests pass, coverage 96.1%.', 45, 150);
	add(0, {type: 'message_stop'});
	return steps;
};

const script = buildScript();

export const initialTurn = (): TurnState => ({
	now: 0,
	speed: 1,
	paused: false,
	running: true,
	phase: 'idle',
	iteration: 0,
	blocks: [],
	wire: [],
	segments: [],
	context: {system: 2100, memory: 1400, history: 1320, thinking: 0, tools: 0, text: 0},
	inputTokens: 0,
	outputTokens: 0,
	firstTokenMs: undefined,
	scriptIndex: 0,
});

const withWire = (state: TurnState, line: WireLine): TurnState => ({
	...state,
	wire: [...state.wire.slice(-400), line],
});

const applyScript = (state: TurnState, action: ScriptAction): TurnState => {
	switch (action.type) {
		case 'message_start':
			return withWire(
				{...state, inputTokens: action.inputTokens},
				{kind: 'srv', label: `message_start {in:${action.inputTokens}}`},
			);
		case 'phase':
			return withWire(
				{
					...state,
					phase: action.phase,
					iteration: action.phase === 'reason' ? state.iteration + 1 : state.iteration,
				},
				{kind: 'sys', label: `loop.phase → ${action.phase.toUpperCase()}`},
			);
		case 'block_start': {
			const block: Block = {
				id: action.id,
				kind: action.kind,
				phase: action.phase,
				title: action.title,
				startedAt: state.now,
				text: '',
				done: false,
				endedAt: state.now,
				tokens: 0,
			};
			return withWire(
				{...state, blocks: [...state.blocks, block]},
				{kind: 'srv', label: `content_block_start[${action.id}] ${action.kind}`},
			);
		}
		case 'delta': {
			const words = action.text.trim().split(/\s+/).length;
			const tokens = Math.max(1, Math.round(action.text.trim().split(/\s+/).length * 1.3));
			const context = {...state.context};
			if (state.blocks.find(block => block.id === action.id)?.kind === 'thinking') {
				context.thinking += words;
			} else {
				context.text += words;
			}

			return withWire(
				{
					...state,
					context,
					outputTokens: state.outputTokens + tokens,
					firstTokenMs: state.firstTokenMs ?? state.now,
					blocks: state.blocks.map(block =>
						block.id === action.id
							? {...block, text: block.text + action.text, tokens: block.tokens + tokens}
							: block,
					),
				},
				{kind: 'dlt', label: `delta[${action.id}] "${action.text.trim().slice(0, 28)}"`},
			);
		}
		case 'tool_exec':
			return withWire(state, {kind: 'tool', label: `tool_exec ${state.blocks.find(block => block.id === action.id)?.title ?? ''}`});
		case 'tool_output': {
			const context = {...state.context, tools: state.context.tools + Math.round(action.text.length / 4)};
			return withWire(
				{
					...state,
					context,
					blocks: state.blocks.map(block =>
						block.id === action.id ? {...block, text: action.text} : block,
					),
				},
				{kind: 'tool', label: `tool_result[${action.id}] ok ${action.text.length}B`},
			);
		}
		case 'block_stop': {
			const block = state.blocks.find(candidate => candidate.id === action.id);
			const segments = block
				? [...state.segments, {kind: block.kind, startMs: block.startedAt, endMs: state.now}]
				: state.segments;
			return withWire(
				{
					...state,
					segments,
					blocks: state.blocks.map(candidate =>
						candidate.id === action.id ? {...candidate, done: true, endedAt: state.now} : candidate,
					),
				},
				{kind: 'srv', label: `content_block_stop[${action.id}]`},
			);
		}
		case 'subagent':
			return withWire(state, {kind: 'sys', label: `▼ subagent.spawn ${action.name} (isolated context)`});
		case 'message_stop':
			return withWire({...state, running: false, phase: 'done'}, {kind: 'srv', label: 'message_stop ✓ turn complete'});
	}
};

export const reduceTurn = (state: TurnState, action: TurnAction): TurnState => {
	switch (action.type) {
		case 'advance': {
			if (!state.running || state.paused) {
				return state;
			}

			let next = state;
			const target = state.now + action.dt * state.speed;
			while (next.scriptIndex < script.length && script[next.scriptIndex]!.at <= target) {
				const step = script[next.scriptIndex]!;
				next = {
					...applyScript({...next, now: step.at}, step.action),
					scriptIndex: next.scriptIndex + 1,
				};
			}

			return {...next, now: target};
		}
		case 'set_speed':
			return {...state, speed: action.speed};
		case 'toggle_pause':
			return {...state, paused: !state.paused};
		case 'restart':
			return {...initialTurn(), speed: state.speed};
	}
};

export const estimateCost = (state: TurnState): number =>
	state.inputTokens * (3 / 1e6) + state.outputTokens * (15 / 1e6);
