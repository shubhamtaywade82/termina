import {createContext} from 'react';

export type Props = {
	readonly activeId?: string;
	// `token` identifies one registration. Components can share an id, so removal and scope changes use the token.
	readonly add: (
		id: string,
		options: {autoFocus: boolean; token: symbol},
	) => void;
	readonly remove: (token: symbol) => void;
	readonly setScope: (token: symbol, scope: symbol | undefined) => void;
	readonly activate: (id: string) => void;
	readonly deactivate: (id: string) => void;
	readonly enableFocus: () => void;
	readonly disableFocus: () => void;
	readonly focusNext: () => void;
	readonly focusPrevious: () => void;
	readonly focusFirstInScope: (scope: symbol | undefined) => void;
	readonly focus: (id: string) => void;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const FocusContext = createContext<Props>({
	activeId: undefined,
	add() {},
	remove() {},
	setScope() {},
	activate() {},
	deactivate() {},
	enableFocus() {},
	disableFocus() {},
	focusNext() {},
	focusPrevious() {},
	focusFirstInScope() {},
	focus() {},
});

FocusContext.displayName = 'InternalFocusContext';

export default FocusContext;
