# @nemesis-oss/termina-ui

40 components for terminal user interfaces, built on [`@nemesis-oss/termina-core`](https://www.npmjs.com/package/@nemesis-oss/termina-core). Thirty-eight of them read their styles from a theme, so one `ThemeProvider` can restyle a whole screen.

It started as a fork of [ink-ui](https://github.com/vadimdemedes/ink-ui) 2.0.0 and adds 25 components, grapheme-aware text editing and two scrolling viewers.

## Install

```sh
npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react
```

Requires Node.js 22 or newer and React 19.3 or newer.

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {Select, Spinner} from '@nemesis-oss/termina-ui';

const environments = [
	{label: 'Staging', value: 'staging'},
	{label: 'Production', value: 'production'},
];

function Deploy() {
	return (
		<Box flexDirection="column" gap={1}>
			<Spinner label="Fetching targets" />
			<Text>Deploy to:</Text>
			<Select options={environments} onChange={(value) => console.log(value)} />
		</Box>
	);
}

render(<Deploy />);
```

## Components

Accordion, Alert, Autocomplete, Badge, CodeBlock, ConfirmInput, DataTable, Dialog, DiffView, Divider, EmailInput, Gauge, Header, JSONViewer, KeyHint, LoadingBar, LogStream, Markdown, MultilineTextInput, MultiSelect, OrderedList, PasswordInput, ProgressBar, ScrollBox, Select, Sparkline, Spinner, StatusMessage, Stepper, StreamingText, Table, Tabs, TextInput, Toast, TokenCounter, Typewriter, TreeView and UnorderedList.

Every component has a page with a live preview: https://shubhamtaywade82.github.io/termina/ui/overview

## License

MIT. ink-ui is copyright Vadym Demedes. See [LICENSE](LICENSE).
