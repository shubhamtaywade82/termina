# @nemesis-oss/termina-core

React renderer for terminal user interfaces. It mounts a React tree on a terminal, lays it out with Yoga (flexbox), and redraws only what changed.

It is a fork of [Ink](https://github.com/vadimdemedes/ink) 8.0.0. On top of Ink it adds reflow-aware resize, mouse support (`useMouse` and `<Box onClick>`), OSC 8 hyperlinks, OSC 52 clipboard writes, and a terminal capability probe. Input hooks stay idle on piped stdin instead of throwing.

The component kit built on it is [`@nemesis-oss/termina-ui`](https://www.npmjs.com/package/@nemesis-oss/termina-ui).

## Install

```sh
npm install @nemesis-oss/termina-core react
```

Requires Node.js 22 or newer and React 19.3 or newer.

## Usage

```tsx
import {useEffect, useState} from 'react';
import {Box, Text, render} from '@nemesis-oss/termina-core';

function Counter() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCount((previous) => previous + 1);
		}, 100);

		return () => {
			clearInterval(timer);
		};
	}, []);

	return (
		<Box borderStyle="round" paddingX={1}>
			<Text color="green">{count} ticks</Text>
		</Box>
	);
}

render(<Counter />);
```

## Documentation

Guides and the full API reference: https://shubhamtaywade82.github.io/termina/

## License

MIT. Ink is copyright Vadym Demedes and Sindre Sorhus. See [LICENSE](LICENSE).
