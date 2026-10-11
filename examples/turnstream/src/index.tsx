import React, {useEffect, useReducer, useState} from 'react';
import chalk from 'chalk';
import {Box, Text, render, useApp, useInput, useWindowSize} from '@fork/core';
import {LogStream, ScrollBox, TextInput} from '@fork/ui';
import {
	type Block,
	type BlockKind,
	type Phase,
	type TurnAction,
	type TurnState,
	type WireLine,
	estimateCost,
	initialTurn,
	phases,
	reduceTurn,
} from './turn.js';

const headerRows = 2;
const footerRows = 3;
const leftWidth = 38;
const rightWidth = 34;
const contextWindow = 200_000;
const contextZoom = 8;

const phaseColor: Record<Phase, string> = {
	idle: 'gray',
	reason: 'yellow',
	act: 'blue',
	observe: 'magenta',
	respond: 'green',
	done: 'green',
};

const kindColor: Record<BlockKind, string> = {
	thinking: 'yellow',
	tool: 'blue',
	text: 'green',
};

const wireColor: Record<WireLine['kind'], (text: string) => string> = {
	srv: text => chalk.hex('#87afff')(text),
	dlt: text => chalk.hex('#4a6a4a')(text),
	tool: text => chalk.hex('#ffff5f')(text),
	sys: text => chalk.hex('#8a8a8a')(text),
};

const formatMs = (ms: number): string =>
	ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;

const LoopStrip = ({phase}: {readonly phase: Phase}) => (
	<Box>
		{phases.map((candidate, index) => {
			const isActive = candidate === phase;
			return (
				<Box key={candidate}>
					<Text
						color={isActive ? 'black' : 'gray'}
						backgroundColor={isActive ? phaseColor[candidate] : undefined}
						bold={isActive}
					>
						{` ${candidate.toUpperCase()} `}
					</Text>
					{index < phases.length - 1 ? <Text dimColor>{candidate === 'observe' ? '↺' : '→'}</Text> : null}
				</Box>
			);
		})}
	</Box>
);

const Header = ({turn, width}: {readonly turn: TurnState; readonly width: number}) => {
	const elapsed = turn.now / 1000;
	const tokensPerSecond = elapsed > 0 ? Math.round(turn.outputTokens / elapsed) : 0;
	const contextTokens = Object.values(turn.context).reduce((sum, value) => sum + value, 0);
	// Two rows, each clipped to the terminal width. A wrapping header would push the body and the footer off the screen.
	return (
		<Box flexDirection="column" width={width} height={headerRows}>
			<Box flexShrink={0}>
				<Text color="cyan" bold>
					◉ TURNSTREAM{' '}
				</Text>
				<Text dimColor>agentic-loop observatory </Text>
				<LoopStrip phase={turn.phase} />
				<Text color="yellow"> iter {turn.iteration} · {turn.paused ? 'paused' : turn.phase}</Text>
			</Box>
			<Text wrap="truncate-end">
				<Text dimColor>elapsed </Text>
				<Text color="cyan">{elapsed.toFixed(2)}s</Text>
				<Text dimColor>  tok/s </Text>
				<Text color="blue">{tokensPerSecond}</Text>
				<Text dimColor>  out </Text>
				<Text color="magenta">{turn.outputTokens}</Text>
				<Text dimColor>  ctx </Text>
				<Text>{(contextTokens / 1000).toFixed(1)}k</Text>
				<Text dimColor>  cost </Text>
				<Text color="green">{'$'}{estimateCost(turn).toFixed(4)}</Text>
				<Text dimColor>  wire </Text>
				<Text>{turn.wire.length}</Text>
			</Text>
		</Box>
	);
};

const DiffLine = ({line}: {readonly line: string}) => {
	const background = line.startsWith('+') ? '#003200' : line.startsWith('-') ? '#3c0000' : undefined;
	const color = line.startsWith('+') ? 'green' : line.startsWith('-') ? 'red' : 'gray';
	return (
		<Box backgroundColor={background}>
			<Text color={color}>{line}</Text>
		</Box>
	);
};

const BlockView = ({block, now, collapsed, onToggle}: {readonly block: Block; readonly now: number; readonly collapsed: boolean; readonly onToggle: (id: number) => void}) => {
	const duration = (block.done ? block.endedAt : now) - block.startedAt;
	const icon = block.kind === 'tool' ? '⚙' : '✎';
	return (
		<Box flexDirection="column" borderStyle="round" borderColor={block.done ? 'gray' : 'yellow'} paddingX={1}>
			<Box onClick={() => onToggle(block.id)}>
			<Text>
				<Text color={phaseColor[block.phase]} bold>
					{` ${block.phase.toUpperCase()} `}
				</Text>{' '}
				<Text color={kindColor[block.kind]}>{icon} </Text>
				<Text bold>{block.title}</Text>
				<Text dimColor>
					{'  '}
					{block.done ? chalk.green('✓') : chalk.yellow('⠋')} {formatMs(duration)} · {block.tokens} tok
				</Text>
			</Text>
			</Box>
			{collapsed ? null : block.kind === 'tool' && block.title.startsWith('Edit') ? (
				<Box flexDirection="column">
					{block.text.split('\n').map((line, index) => (
						<DiffLine key={index} line={line} />
					))}
				</Box>
			) : collapsed ? null : (
				<Text
					color={block.kind === 'thinking' ? 'gray' : undefined}
					italic={block.kind === 'thinking'}
					dimColor={block.kind === 'tool'}
				>
					{block.text}
					{block.done ? '' : '▌'}
				</Text>
			)}
		</Box>
	);
};

const ContextPanel = ({turn}: {readonly turn: TurnState}) => {
	const width = rightWidth - 4;
	const colors: Record<keyof TurnState['context'], string> = {
		system: '#5f5f87',
		memory: '#875f87',
		history: '#5f875f',
		thinking: '#afaf00',
		tools: '#005faf',
		text: '#00af00',
	};
	const segments = (Object.keys(colors) as Array<keyof TurnState['context']>).map(key => {
		const cells = Math.min(width, Math.round((turn.context[key] / contextWindow) * width * contextZoom));
		return {key, cells};
	});
	const used = segments.reduce((sum, segment) => sum + segment.cells, 0);
	const total = Object.values(turn.context).reduce((sum, value) => sum + value, 0);
	return (
		<Box flexDirection="column" paddingX={1}>
			<Text dimColor wrap="truncate-end">
				context · {((total / contextWindow) * 100).toFixed(1)}% · {contextZoom}× zoom
			</Text>
			<Text>
				{segments.map(segment => (
					<Text key={segment.key} color={colors[segment.key]}>
						{'█'.repeat(segment.cells)}
					</Text>
				))}
				<Text color="#1a1a1a">{'░'.repeat(Math.max(0, width - used))}</Text>
			</Text>
		</Box>
	);
};

const Waterfall = ({turn}: {readonly turn: TurnState}) => {
	const track = 14;
	const total = Math.max(1, turn.now);
	return (
		<Box flexDirection="column" paddingX={1}>
			<Text dimColor>latency waterfall · {formatMs(total)}</Text>
			{turn.blocks.map(block => {
				const end = block.done ? block.endedAt : turn.now;
				const left = Math.min(track - 1, Math.round((block.startedAt / total) * track));
				const width = Math.max(1, Math.round(((end - block.startedAt) / total) * track));
				return (
					<Text key={block.id}>
						<Text dimColor>{block.title.slice(0, 10).padEnd(10)} </Text>
						<Text>{' '.repeat(left)}</Text>
						<Text color={kindColor[block.kind]}>{'█'.repeat(Math.min(width, track - left))}</Text>
					</Text>
				);
			})}
		</Box>
	);
};

const Economics = ({turn}: {readonly turn: TurnState}) => {
	const elapsed = Math.max(0.001, turn.now / 1000);
	const rows: Array<[string, string, string]> = [
		['input', turn.inputTokens.toLocaleString(), 'blue'],
		['output', turn.outputTokens.toLocaleString(), 'magenta'],
		['velocity', `${Math.round(turn.outputTokens / elapsed)} tok/s`, 'cyan'],
		['TTFT', turn.firstTokenMs === undefined ? '—' : formatMs(turn.firstTokenMs), 'yellow'],
		['turn cost', `$${estimateCost(turn).toFixed(4)}`, 'green'],
		['iterations', String(turn.iteration), 'white'],
		['tool calls', String(turn.blocks.filter(block => block.kind === 'tool').length), 'blue'],
		['wire events', String(turn.wire.length), 'white'],
	];
	return (
		<Box flexDirection="column" paddingX={1}>
			<Text dimColor>token economics</Text>
			{rows.map(([label, value, color]) => (
				<Text key={label}>
					<Text dimColor>{label.padEnd(12)}</Text>
					<Text color={color} bold>
						{value}
					</Text>
				</Text>
			))}
		</Box>
	);
};

const Timeline = ({turn, width}: {readonly turn: TurnState; readonly width: number}) => {
	const total = Math.max(1, turn.now);
	const cells = Array.from({length: width}, () => ' ');
	const colorOf: Record<BlockKind, (text: string) => string> = {
		thinking: text => chalk.hex('#8a8a2a')(text),
		tool: text => chalk.hex('#2a5a8a')(text),
		text: text => chalk.hex('#2a8a2a')(text),
	};
	for (const segment of turn.segments) {
		const from = Math.floor((segment.startMs / total) * width);
		const to = Math.max(from + 1, Math.ceil((segment.endMs / total) * width));
		for (let cell = from; cell < Math.min(to, width); cell++) {
			cells[cell] = colorOf[segment.kind]('█');
		}
	}

	const head = Math.min(width - 1, Math.floor((turn.now / total) * width));
	cells[head] = chalk.red('│');
	return <Text>{cells.join('')}</Text>;
};

const App = () => {
	const {exit} = useApp();
	const {columns, rows} = useWindowSize();
	const [turn, dispatch] = useReducer(
		(state: TurnState, action: TurnAction) => reduceTurn(state, action),
		undefined,
		initialTurn,
	);
	const [mode, setMode] = useState<'navigate' | 'edit'>('navigate');
	const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(() => new Set());
	const toggleBlock = (id: number) => {
		setCollapsed(current => {
			const next = new Set(current);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}

			return next;
		});
	};
	const [prompt, setPrompt] = useState('audit src/auth.ts for security issues, add rate limiting, update tests');

	// The script advances on a fixed tick. Pause and speed are part of the reducer state, so the clock, the script and the rendered frame always agree.
	useEffect(() => {
		const timer = setInterval(() => {
			dispatch({type: 'advance', dt: 50});
		}, 50);
		return () => {
			clearInterval(timer);
		};
	}, []);

	useInput(
		(input, key) => {
			if (input === ' ') {
				dispatch({type: 'toggle_pause'});
			} else if (['1', '2', '3', '4'].includes(input)) {
				dispatch({type: 'set_speed', speed: [0.5, 1, 2, 4][Number(input) - 1]!});
			} else if (input === 'r') {
				dispatch({type: 'restart'});
			} else if (input === '/') {
				setMode('edit');
			} else if (input === 'q') {
				exit();
			}
		},
		{isActive: mode === 'navigate'},
	);

	useInput(
		(_input, key) => {
			if (key.escape) {
				setMode('navigate');
			}
		},
		{isActive: mode === 'edit'},
	);

	const bodyRows = Math.max(6, rows - headerRows - footerRows);
	const centerWidth = Math.max(20, columns - leftWidth - rightWidth);
	const wireLines = turn.wire.map(line => wireColor[line.kind](line.label));

	return (
		<Box flexDirection="column" width={columns} height={rows}>
			<Header turn={turn} width={columns} />
			<Box flexDirection="row" height={bodyRows}>
				<Box flexDirection="column" width={leftWidth} height={bodyRows} borderStyle="single" borderColor="gray">
					<Text dimColor>● wire events — SSE</Text>
					<LogStream lines={wireLines} height={bodyRows - 3} maxLines={400} />
				</Box>
				<Box flexDirection="column" width={centerWidth} height={bodyRows} borderStyle="single" borderColor="gray">
					<Text dimColor>streaming transcript — content blocks</Text>
					<ScrollBox height={bodyRows - 3} followTail>
						<Box flexDirection="column" gap={0}>
							{turn.blocks.map(block => (
								<BlockView key={block.id} block={block} now={turn.now} collapsed={collapsed.has(block.id)} onToggle={toggleBlock} />
							))}
						</Box>
					</ScrollBox>
				</Box>
				<Box flexDirection="column" width={rightWidth} height={bodyRows} borderStyle="single" borderColor="gray">
					<ContextPanel turn={turn} />
					<Waterfall turn={turn} />
					<Economics turn={turn} />
				</Box>
			</Box>
			<Box flexDirection="column" height={footerRows}>
				<Timeline turn={turn} width={columns} />
				<Box>
					<Box onClick={() => dispatch({type: 'toggle_pause'})} backgroundColor={turn.paused ? 'yellow' : 'blue'}>
						<Text color="black" bold>
							{turn.paused ? ' ▶ resume ' : ' ⏸ pause '}
						</Text>
					</Box>
					{[0.5, 1, 2, 4].map(speed => (
						<Box
							key={speed}
							marginLeft={1}
							onClick={() => dispatch({type: 'set_speed', speed})}
							backgroundColor={turn.speed === speed ? 'blue' : undefined}
						>
							<Text color={turn.speed === speed ? 'black' : 'gray'}>{` ${speed}× `}</Text>
						</Box>
					))}
					<Text dimColor>   space pause · 1-4 speed · r rerun · / edit prompt · q quit · shift-drag selects text</Text>
				</Box>
				<Box>
					<Text color="green" bold>
						❯{' '}
					</Text>
					<TextInput
						defaultValue={prompt}
						isDisabled={mode !== 'edit'}
						onSubmit={value => {
							setPrompt(value);
							setMode('navigate');
							dispatch({type: 'restart'});
						}}
					/>
				</Box>
			</Box>
		</Box>
	);
};

render(<App />, {alternateScreen: true, incrementalRendering: true, maxFps: 30, mouse: true});
