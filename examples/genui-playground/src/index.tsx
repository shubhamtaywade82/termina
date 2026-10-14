import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { Box, Text, render, useApp, useInput } from '@nemesis-oss/termina-core';
import {
	GenUIRenderer,
	createActionDispatcher,
	createDefaultRegistry,
	createGenUIRuntime,
	createLanguageAdapter,
	createStreamCoordinator,
	type GenUIElementNode,
} from '@nemesis-oss/termina-genui';
import {
	DASHBOARD_PROGRAM,
	FORM_PROGRAM,
	STREAMING_CHUNKS,
} from './scenarios.js';

type Tab = 'dashboard' | 'form' | 'streaming';

function App() {
	const { exit } = useApp();
	const [tab, setTab] = useState<Tab>('dashboard');
	const [actionMessage, setActionMessage] = useState<string>('');
	const [streamTree, setStreamTree] = useState<GenUIElementNode | null>(null);
	const [streamIndex, setStreamIndex] = useState(0);

	const registry = useMemo(() => createDefaultRegistry(), []);
	const adapter = useMemo(() => createLanguageAdapter(registry), [registry]);
	const runtime = useMemo(() => createGenUIRuntime(), []);

	const dispatcher = useMemo(() => {
		return createActionDispatcher([
			{
				name: 'applyConfig',
				schema: z.object({ target: z.string().optional() }),
				handler: ({ target }) => {
					const values = runtime.getValues();
					setActionMessage(`Dispatched applyConfig (env=${values.envName}, region=${values.region})`);
				},
			},
		]);
	}, [runtime]);

	// Simulate incremental model streaming tokens chunk-by-chunk
	useEffect(() => {
		if (tab !== 'streaming') return;
		const coordinator = createStreamCoordinator(adapter);
		const unsubscribe = coordinator.subscribe(update => {
			setStreamTree(update.tree);
		});

		let idx = 0;
		const interval = setInterval(() => {
			if (idx < STREAMING_CHUNKS.length) {
				coordinator.append(STREAMING_CHUNKS[idx]!);
				idx++;
				setStreamIndex(idx);
			} else {
				coordinator.complete();
				clearInterval(interval);
			}
		}, 300);

		return () => {
			clearInterval(interval);
			unsubscribe();
		};
	}, [tab, adapter]);

	useInput((input, key) => {
		if (input === 'q' || key.escape) exit();
		if (input === '1') setTab('dashboard');
		if (input === '2') setTab('form');
		if (input === '3') {
			setTab('streaming');
			setStreamIndex(0);
		}
		if (input === 'a' && tab === 'form') {
			dispatcher.dispatch('applyConfig', { target: 'cluster' });
		}
	});

	const activeTree = useMemo(() => {
		if (tab === 'dashboard') return adapter.parse(DASHBOARD_PROGRAM).root;
		if (tab === 'form') return adapter.parse(FORM_PROGRAM).root;
		return streamTree;
	}, [tab, adapter, streamTree]);

	return (
		<Box flexDirection="column" padding={1} gap={1}>
			<Header tab={tab} />
			<Box borderStyle="single" borderColor="gray" padding={1}>
				<GenUIRenderer
					node={activeTree}
					registry={registry}
					runtime={runtime}
					actionDispatcher={dispatcher}
					isStreaming={tab === 'streaming'}
				/>
			</Box>
			<Footer tab={tab} streamIndex={streamIndex} actionMessage={actionMessage} />
		</Box>
	);
}

function Header({ tab, onTabChange }: { readonly tab: Tab; readonly onTabChange: (t: Tab) => void }) {
	return (
		<Box flexDirection="column" gap={0}>
			<Text bold color="cyan">
				TERMINA GENERATIVE UI PLAYGROUND
			</Text>
			<Box gap={2}>
				<Box onClick={() => onTabChange('dashboard')}>
					<Text color={tab === 'dashboard' ? 'cyan' : 'gray'} bold={tab === 'dashboard'}>
						[1] Dashboard
					</Text>
				</Box>
				<Box onClick={() => onTabChange('form')}>
					<Text color={tab === 'form' ? 'green' : 'gray'} bold={tab === 'form'}>
						[2] Form & Runtime
					</Text>
				</Box>
				<Box onClick={() => onTabChange('streaming')}>
					<Text color={tab === 'streaming' ? 'yellow' : 'gray'} bold={tab === 'streaming'}>
						[3] Live Streaming
					</Text>
				</Box>
				<Text color="gray">[q] Quit</Text>
			</Box>
		</Box>
	);
}


function Footer({
	tab,
	streamIndex,
	actionMessage,
}: {
	readonly tab: Tab;
	readonly streamIndex: number;
	readonly actionMessage: string;
}) {
	return (
		<Box flexDirection="column">
			{tab === 'streaming' && (
				<Text dimColor>
					Streaming chunk {streamIndex} of {STREAMING_CHUNKS.length}...
				</Text>
			)}
			{tab === 'form' && (
				<Text dimColor>Press [a] to trigger registered "applyConfig" action</Text>
			)}
			{actionMessage !== '' && (
				<Text color="green" bold>
					✓ {actionMessage}
				</Text>
			)}
		</Box>
	);
}

render(<App />, { mouse: true, alternateScreen: true });

