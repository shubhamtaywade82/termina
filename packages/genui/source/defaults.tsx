import React from 'react';
import { z } from 'zod';
import { Box, Text } from '@nemesis-oss/termina-core';
import {
	Alert,
	Badge,
	CodeBlock,
	LoadingBar,
	Markdown,
	ProgressBar,
	Select,
	StatusMessage,
	Table,
	TextInput,
} from '@nemesis-oss/termina-ui';
import type { GenUIComponent, GenUIRenderContext } from './types.js';

export function createDefaultComponents(): GenUIComponent<any>[] {
	return [
		{
			name: 'Container',
			description: 'A layout container box with border and direction',
			schema: z.object({
				direction: z.enum(['row', 'column']).optional(),
				gap: z.number().optional(),
				borderStyle: z.enum(['single', 'double', 'round', 'bold', 'none']).optional(),
				children: z.array(z.any()).optional(),
			}),
			render: (props: any, ctx: GenUIRenderContext) => (
				<Box
					flexDirection={props.direction ?? 'column'}
					gap={props.gap ?? 0}
					borderStyle={props.borderStyle && props.borderStyle !== 'none' ? props.borderStyle : undefined}
				>
					{ctx.renderChildren(props.children)}
				</Box>
			),
		},
		{
			name: 'Text',
			description: 'Styled text block',
			schema: z.object({
				content: z.string(),
				color: z.string().optional(),
				bold: z.boolean().optional(),
				dim: z.boolean().optional(),
			}),
			render: (props: any) => (
				<Text color={props.color} bold={props.bold} dimColor={props.dim}>
					{props.content}
				</Text>
			),
		},
		{
			name: 'Badge',
			description: 'A status badge',
			schema: z.object({
				text: z.string(),
				variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
			}),
			render: (props: any) => {
				const colors: Record<string, any> = {
					info: 'blue',
					success: 'green',
					warning: 'yellow',
					error: 'red',
				};
				return <Badge color={colors[props.variant ?? 'info'] ?? 'magenta'}>{props.text}</Badge>;
			},
		},
		{
			name: 'Alert',
			description: 'An alert message with severity variant',
			schema: z.object({
				title: z.string(),
				message: z.string().optional(),
				variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
			}),
			render: (props: any) => (
				<Alert variant={props.variant ?? 'info'} title={props.title}>
					{props.message ?? ''}
				</Alert>
			),
		},
		{
			name: 'StatusMessage',
			description: 'Status message indicator',
			schema: z.object({
				message: z.string(),
				variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
			}),
			render: (props: any) => (
				<StatusMessage variant={props.variant ?? 'info'}>
					{props.message}
				</StatusMessage>
			),
		},
		{
			name: 'ProgressBar',
			description: 'Progress bar displaying completion percentage',
			schema: z.object({
				percent: z.number(),
				label: z.string().optional(),
			}),
			render: (props: any) => (
				<Box flexDirection="column">
					{props.label && <Text>{props.label}</Text>}
					<ProgressBar value={props.percent} />
				</Box>
			),
		},
		{
			name: 'LoadingBar',
			description: 'Animated loading progress bar with label',
			schema: z.object({
				label: z.string(),
			}),
			render: (props: any) => (
				<Box flexDirection="column">
					<Text>{props.label}</Text>
					<LoadingBar />
				</Box>
			),
		},
		{
			name: 'CodeBlock',
			description: 'Syntax-highlighted code block',
			schema: z.object({
				code: z.string(),
				language: z.string().optional(),
			}),
			render: (props: any) => (
				<CodeBlock code={props.code} language={props.language} />
			),
		},
		{
			name: 'Markdown',
			description: 'Render markdown text formatted for terminal',
			schema: z.object({
				content: z.string(),
			}),
			render: (props: any) => (
				<Markdown>{props.content}</Markdown>
			),
		},
		{
			name: 'Table',
			description: 'Structured tabular data view',
			schema: z.object({
				columns: z.array(z.string()),
				data: z.array(z.record(z.string(), z.any())),
			}),
			render: (props: any) => {
				const cols = (props.columns ?? []).map((col: string) => ({ key: col, header: col }));
				const rows = (props.data ?? []).map((row: any) => {
					const r: Record<string, string | number> = {};
					for (const [k, v] of Object.entries(row)) {
						r[k] = typeof v === 'number' ? v : String(v ?? '');
					}
					return r;
				});
				return <Table columns={cols} rows={rows} />;
			},
		},
		{
			name: 'Button',
			description: 'An interactive action button',
			schema: z.object({
				label: z.string(),
				action: z.string(),
			}),
			render: (props: any, ctx: GenUIRenderContext) => (
				<Box
					borderStyle="round"
					borderColor="cyan"
					paddingX={1}
					onClick={() => {
						if (props.action) {
							void ctx.dispatchAction(props.action, ctx.runtime.getValues());
						}
					}}
				>
					<Text color="cyan" bold>[ {props.label} ]</Text>
				</Box>
			),
		},
		{
			name: 'TextInput',
			description: 'Text input field bound to runtime form state',
			schema: z.object({
				name: z.string(),
				label: z.string().optional(),
				placeholder: z.string().optional(),
				defaultValue: z.string().optional(),
			}),
			render: (props: any, ctx: GenUIRenderContext) => {
				const current = (ctx.runtime.getValue(props.name) as string) ?? props.defaultValue ?? '';
				return (
					<Box flexDirection="column">
						{props.label && <Text bold>{props.label}:</Text>}
						<TextInput
							value={current}
							placeholder={props.placeholder}
							onChange={val => ctx.runtime.setValue(props.name, val)}
						/>
					</Box>
				);
			},
		},
		{
			name: 'Select',
			description: 'Selection input bound to runtime form state',
			schema: z.object({
				name: z.string(),
				label: z.string().optional(),
				options: z.array(z.string()),
			}),
			render: (props: any, ctx: GenUIRenderContext) => {
				const options = (props.options ?? []).map((opt: string) => ({ label: opt, value: opt }));
				return (
					<Box flexDirection="column">
						{props.label && <Text bold>{props.label}:</Text>}
						<Select
							options={options}
							onChange={val => ctx.runtime.setValue(props.name, val)}
						/>
					</Box>
				);
			},
		},
	];
}
