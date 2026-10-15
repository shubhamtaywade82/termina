import type { GenUIRegistry, GenUIComponent } from './types.js';

export type PromptOptions = {
	readonly preamble?: string;
	readonly examples?: readonly string[];
};

function formatComponentSignature(component: GenUIComponent<any>): string {
	const jsonSchema = (component.schema as any)._def
		? (component.schema as any)
		: null;

	const keys = jsonSchema && 'shape' in jsonSchema ? Object.keys(jsonSchema.shape) : [];
	const argsStr = keys.length > 0 ? keys.join(', ') : '';

	return `- ${component.name}(${argsStr}): ${component.description}`;
}

export function generateGenUIPrompt(
	registry: GenUIRegistry,
	options: PromptOptions = {},
): string {
	const components = registry.getAll().slice().sort((a, b) => a.name.localeCompare(b.name));
	const signatures = components.map(formatComponentSignature).join('\n');

	const preamble = options.preamble
		? `${options.preamble}\n\n`
		: '';

	const firstComp = components[0]?.name ?? 'Widget';
	const examples = options.examples && options.examples.length > 0
		? `\n## Examples\n\n${options.examples.join('\n\n')}\n`
		: `
## Example

\`\`\`openui-lang
root = ${firstComp}()
\`\`\`
`;

	return `${preamble}You are a terminal UI assistant that generates declarative openui-lang code for Termina.
Your ENTIRE response must be valid openui-lang code. Do NOT wrap output in markdown codeblocks unless instructed.

## Syntax Rules
1. Each statement is on its own line: \`identifier = Expression\`
2. \`root\` is the required entry point: \`root = ComponentName(...)\`
3. Arguments are positional (order matters, not names).
4. References can be hoisted: define child nodes before or after parent.
5. Strings use double quotes: "text".
6. If a requested UI element is not available, compose it using available components.

## Available Components
${signatures}

## Streaming Guidelines
- Output the \`root\` component statement first so the layout renders immediately.
- Then output the child statements line by line.
${examples}`.trim();
}
