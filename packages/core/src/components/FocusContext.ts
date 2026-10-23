import {createContext, type RefObject} from 'react';
import {type DOMElement} from '../dom.js';
import {type Direction} from '../spatial.js';

export type Props = {
	readonly activeId?: string;
	// `token` identifies one registration. Components can share an id, so removal and scope changes use the token.
	readonly add: (
		id: string,
		options: {autoFocus: boolean; token: symbol},
	) => void;
	readonly remove: (token: symbol) => void;
	readonly setScope: (token: symbol, scope: symbol | undefined) => void;
	// The element whose layout gives the registration its rectangle for directional focus. Read at the time of a move, so re-rendering does not change the focus order.
	readonly setElement: (
		token: symbol,
		// eslint-disable-next-line @typescript-eslint/no-restricted-types -- React ref objects are typed with null until the element mounts.
		element: RefObject<DOMElement | null> | undefined,
	) => void;
	readonly activate: (id: string) => void;
	readonly deactivate: (id: string) => void;
	readonly enableFocus: () => void;
	readonly disableFocus: () => void;
	readonly focusNext: () => void;
	readonly focusPrevious: () => void;
	readonly focusDirection: (direction: Direction) => void;
	readonly focusFirstInScope: (scope: symbol | undefined) => void;
	readonly focus: (id: string) => void;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const FocusContext = createContext<Props>({
	activeId: undefined,
	add() {},
	remove() {},
	setScope() {},
	setElement() {},
	activate() {},
	deactivate() {},
	enableFocus() {},
	disableFocus() {},
	focusNext() {},
	focusPrevious() {},
	focusDirection() {},
	focusFirstInScope() {},
	focus() {},
});

FocusContext.displayName = 'InternalFocusContext';

export default FocusContext;
