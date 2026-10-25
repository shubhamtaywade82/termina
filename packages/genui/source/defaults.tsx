import React from 'react';
import {z} from 'zod';
import {Box, Text} from '@nemesis-oss/termina-core';
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
import {hasText, isRecord} from './guards.js';
import type {GenUIComponent, GenUIRenderContext} from './types.js';

const containerSchema = z.object({
	direction: z.enum(['row', 'column']).optional(),
	gap: z.number().optional(),
	borderStyle: z.enum(['single', 'double', 'round', 'bold', 'none']).optional(),
	children: z.array(z.unknown()).optional(),
});

const textSchema = z.object({
	content: z.string(),
	color: z.string().optional(),
	bold: z.boolean().optional(),
	dim: z.boolean().optional(),
});

const badgeSchema = z.object({
	text: z.string(),
	variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
});

const alertSchema = z.object({
	title: z.string(),
	message: z.string().optional(),
	variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
});

const statusMessageSchema = z.object({
	message: z.string(),
	variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
});

const progressBarSchema = z.object({
	percent: z.number(),
	label: z.string().optional(),
});

const loadingBarSchema = z.object({
	label: z.string(),
});

const codeBlockSchema = z.object({
	code: z.string(),
	language: z.string().optional(),
});

const markdownSchema = z.object({
	content: z.string(),
});

const tableSchema = z.object({
	columns: z.array(z.string()),
	// Rows that are not objects are skipped at render time, so the schema accepts any value.
	data: z.array(z.unknown()),
});

const buttonSchema = z.object({
	label: z.string(),
	action: z.string(),
});

const textInputSchema = z.object({
	name: z.string(),
	label: z.string().optional(),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
});

const selectSchema = z.object({
	name: z.string(),
	label: z.string().optional(),
	options: z.array(z.string()),
});

type ContainerProps = z.infer<typeof containerSchema>;
type TextProps = z.infer<typeof textSchema>;
type BadgeProps = z.infer<typeof badgeSchema>;
type AlertProps = z.infer<typeof alertSchema>;
type StatusMessageProps = z.infer<typeof statusMessageSchema>;
type ProgressBarProps = z.infer<typeof progressBarSchema>;
type LoadingBarProps = z.infer<typeof loadingBarSchema>;
type CodeBlockProps = z.infer<typeof codeBlockSchema>;
type MarkdownProps = z.infer<typeof markdownSchema>;
type TableProps = z.infer<typeof tableSchema>;
type ButtonProps = z.infer<typeof buttonSchema>;
type TextInputProps = z.infer<typeof textInputSchema>;
type SelectProps = z.infer<typeof selectSchema>;

const badgeColors = {
	info: 'blue',
	success: 'green',
	warning: 'yellow',
	error: 'red',
} as const;

type TableCell = string | number;

// Objects become JSON, because String() would print them as "[object Object]".
function formatCell(value: unknown): TableCell {
	if (typeof value === 'number') {
		return value;
	}

	if (value === undefined || value === null) {
		return '';
	}

	return typeof value === 'string' || typeof value === 'boolean'
		? String(value)
		: JSON.stringify(value);
}

function toTableRow(row: Record<string, unknown>): Record<string, TableCell> {
	return Object.fromEntries(
		Object.entries(row).map(([key, value]) => [key, formatCell(value)]),
	);
}

function renderTable({columns, data}: TableProps) {
	const cols = columns.map((column) => ({key: column, header: column}));
	const rows = data.flatMap((row) => (isRecord(row) ? [toTableRow(row)] : []));
	return <Table columns={cols} rows={rows} />;
}

export function createDefaultComponents(): Array<GenUIComponent<any>> {
	return [
		{
			name: 'Container',
			description: 'A layout container box with border and direction',
			schema: containerSchema,
			render: (props: ContainerProps, ctx: GenUIRenderContext) => (
				<Box
					flexDirection={props.direction ?? 'column'}
					gap={props.gap ?? 0}
					borderStyle={
						props.borderStyle === undefined || props.borderStyle === 'none'
							? undefined
							: props.borderStyle
					}
				>
					{ctx.renderChildren(props.children)}
				</Box>
			),
		},
		{
			name: 'Text',
			description: 'Styled text block',
			schema: textSchema,
			render: (props: TextProps) => (
				<Text color={props.color} bold={props.bold} dimColor={props.dim}>
					{props.content}
				</Text>
			),
		},
		{
			name: 'Badge',
			description: 'A status badge',
			schema: badgeSchema,
			render: (props: BadgeProps) => (
				<Badge color={badgeColors[props.variant ?? 'info']}>{props.text}</Badge>
			),
		},
		{
			name: 'Alert',
			description: 'An alert message with severity variant',
			schema: alertSchema,
			render: (props: AlertProps) => (
				<Alert variant={props.variant ?? 'info'} title={props.title}>
					{props.message ?? ''}
				</Alert>
			),
		},
		{
			name: 'StatusMessage',
			description: 'Status message indicator',
			schema: statusMessageSchema,
			render: (props: StatusMessageProps) => (
				<StatusMessage variant={props.variant ?? 'info'}>
					{props.message}
				</StatusMessage>
			),
		},
		{
			name: 'ProgressBar',
			description: 'Progress bar displaying completion percentage',
			schema: progressBarSchema,
			render: (props: ProgressBarProps) => (
				<Box flexDirection="column">
					{hasText(props.label) ? <Text>{props.label}</Text> : null}
					<ProgressBar value={props.percent} />
				</Box>
			),
		},
		{
			name: 'LoadingBar',
			description: 'Animated loading progress bar with label',
			schema: loadingBarSchema,
			render: (props: LoadingBarProps) => (
				<Box flexDirection="column">
					<Text>{props.label}</Text>
					<LoadingBar />
				</Box>
			),
		},
		{
			name: 'CodeBlock',
			description: 'Syntax-highlighted code block',
			schema: codeBlockSchema,
			render: (props: CodeBlockProps) => (
				<CodeBlock code={props.code} language={props.language} />
			),
		},
		{
			name: 'Markdown',
			description: 'Render markdown text formatted for terminal',
			schema: markdownSchema,
			render: (props: MarkdownProps) => <Markdown>{props.content}</Markdown>,
		},
		{
			name: 'Table',
			description: 'Structured tabular data view',
			schema: tableSchema,
			render: (props: TableProps) => renderTable(props),
		},
		{
			name: 'Button',
			description: 'An interactive action button',
			schema: buttonSchema,
			render: (props: ButtonProps, ctx: GenUIRenderContext) => (
				<Box
					borderStyle="round"
					borderColor="cyan"
					paddingX={1}
					onClick={() => {
						if (props.action !== '') {
							void ctx.dispatchAction(props.action, ctx.runtime.getValues());
						}
					}}
				>
					<Text bold color="cyan">
						[ {props.label} ]
					</Text>
				</Box>
			),
		},
		{
			name: 'TextInput',
			description: 'Text input field bound to runtime form state',
			schema: textInputSchema,
			render(props: TextInputProps, ctx: GenUIRenderContext) {
				const stored = ctx.runtime.getValue(props.name);
				if (stored === undefined && props.defaultValue !== undefined) {
					// Seed after render: setValue notifies the renderer, and updating state mid-render is not allowed. Without it an untouched default never reaches the action payload.
					queueMicrotask(() => {
						if (ctx.runtime.getValue(props.name) === undefined) {
							ctx.runtime.setValue(props.name, props.defaultValue);
						}
					});
				}

				const current =
					typeof stored === 'string' ? stored : (props.defaultValue ?? '');
				return (
					<Box flexDirection="column">
						{hasText(props.label) ? <Text bold>{props.label}:</Text> : null}
						<TextInput
							value={current}
							placeholder={props.placeholder}
							onChange={(value) => {
								ctx.runtime.setValue(props.name, value);
							}}
						/>
					</Box>
				);
			},
		},
		{
			name: 'Select',
			description: 'Selection input bound to runtime form state',
			schema: selectSchema,
			render(props: SelectProps, ctx: GenUIRenderContext) {
				const options = props.options.map((option) => ({
					label: option,
					value: option,
				}));
				return (
					<Box flexDirection="column">
						{hasText(props.label) ? <Text bold>{props.label}:</Text> : null}
						<Select
							options={options}
							onChange={(value) => {
								ctx.runtime.setValue(props.name, value);
							}}
						/>
					</Box>
				);
			},
		},
	];
}
