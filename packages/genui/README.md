# @nemesis-oss/termina-genui

Generative UI for terminal apps. A model writes a small [OpenUI Lang](https://www.npmjs.com/package/@openuidev/lang-core) program, and `GenUIRenderer` draws it with [`@nemesis-oss/termina-core`](https://www.npmjs.com/package/@nemesis-oss/termina-core) and [`@nemesis-oss/termina-ui`](https://www.npmjs.com/package/@nemesis-oss/termina-ui) components. Model text is sanitized before it reaches the terminal, and props are validated against each component's zod schema.

## Install

```sh
npm install @nemesis-oss/termina-genui @nemesis-oss/termina-core @nemesis-oss/termina-ui react zod
```

Requires Node.js 22 or newer and React 19.3 or newer.

## Usage

```tsx
import {render} from '@nemesis-oss/termina-core';
import {
	GenUIRenderer,
	createActionDispatcher,
	createDefaultRegistry,
	createLanguageAdapter,
	generateGenUIPrompt,
} from '@nemesis-oss/termina-genui';
import {z} from 'zod';

const registry = createDefaultRegistry();
const adapter = createLanguageAdapter(registry);

// Send this as the system prompt so the model knows the available components.
const systemPrompt = generateGenUIPrompt(registry);

const actions = createActionDispatcher([
	{
		name: 'search',
		schema: z.object({city: z.string()}),
		handler: ({city}) => console.log('searching', city),
	},
]);

const program = `
root = Container("column", 1, "single", [field, go])
field = TextInput("city", "City", "Type a city", "Pune")
go = Button("Search", "search")
`;

render(
	<GenUIRenderer
		node={adapter.parse(program).root}
		registry={registry}
		actionDispatcher={actions}
	/>,
);
```

For output that arrives token by token, feed chunks to `createStreamCoordinator(adapter)` and render each `update.tree` as it comes.

A failed action, such as an unknown name or a payload that fails its schema, is shown in red under the UI instead of throwing.

## License

MIT
