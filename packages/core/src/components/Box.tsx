import React, {forwardRef, use, type PropsWithChildren} from 'react';
import {type Except} from 'type-fest';
import {type Styles} from '../styles.js';
import {type DOMElement} from '../dom.js';
import {type MouseEvent} from '../mouse.js';
import {AccessibilityContext} from './AccessibilityContext.js';
import {BackgroundContext} from './BackgroundContext.js';

export type Props = Except<Styles, 'textWrap'> & {
	/**
	A label for the element for screen readers.
	*/
	readonly 'aria-label'?: string;

	/**
	Hide the element from screen readers.
	*/
	readonly 'aria-hidden'?: boolean;

	/**
	The role of the element.
	*/
	readonly 'aria-role'?:
		| 'button'
		| 'checkbox'
		| 'combobox'
		| 'list'
		| 'listbox'
		| 'listitem'
		| 'menu'
		| 'menuitem'
		| 'option'
		| 'progressbar'
		| 'radio'
		| 'radiogroup'
		| 'tab'
		| 'tablist'
		| 'table'
		| 'textbox'
		| 'timer'
		| 'toolbar';

	/**
	The state of the element.
	*/
	readonly 'aria-state'?: {
		readonly busy?: boolean;
		readonly checked?: boolean;
		readonly disabled?: boolean;
		readonly expanded?: boolean;
		readonly multiline?: boolean;
		readonly multiselectable?: boolean;
		readonly readonly?: boolean;
		readonly required?: boolean;
		readonly selected?: boolean;
	};

	/**
	Called when the element is pressed and released in place. A descendant without its own `onClick` passes the click up to this element. Mouse tracking is enabled with `render(..., {mouse: true})`.
	*/
	readonly onClick?: (event: MouseEvent) => void;

	/**
	Called when a mouse button goes down over this element or a descendant.
	*/
	readonly onMouseDown?: (event: MouseEvent) => void;

	/**
	Called when a mouse button comes up over this element or a descendant.
	*/
	readonly onMouseUp?: (event: MouseEvent) => void;

	/**
	Called for wheel steps over this element or a descendant.
	*/
	readonly onWheel?: (event: MouseEvent) => void;
};

/**
`<Box>` is an essential Ink component to build your layout. It's like `<div style="display: flex">` in the browser.
*/
// eslint-disable-next-line @eslint-react/no-forward-ref -- Removing `forwardRef` changes the public component type of `Box`.
const Box = forwardRef<DOMElement, PropsWithChildren<Props>>(
	(
		{
			children,
			backgroundColor,
			flexWrap = 'nowrap',
			flexDirection = 'row',
			'aria-label': ariaLabel,
			'aria-hidden': ariaHidden,
			'aria-role': role,
			'aria-state': ariaState,
			onClick,
			onMouseDown,
			onMouseUp,
			onWheel,
			...style
		},
		ref,
	) => {
		const {isScreenReaderEnabled} = use(AccessibilityContext);
		const inheritedBackgroundColor = use(BackgroundContext);
		if (isScreenReaderEnabled && ariaHidden) {
			return null;
		}

		const effectiveBackgroundColor =
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/strict-boolean-expressions -- Empty background colors inherit from the parent too.
			backgroundColor || inheritedBackgroundColor;

		const mouseHandlers =
			onClick !== undefined ||
			onMouseDown !== undefined ||
			onMouseUp !== undefined ||
			onWheel !== undefined
				? {onClick, onMouseDown, onMouseUp, onWheel}
				: undefined;

		const boxElement = (
			<ink-box
				ref={ref}
				style={{
					flexWrap,
					flexDirection,
					flexGrow: 0,
					flexShrink: 1,
					...style,
					backgroundColor,
					overflowX: style.overflowX ?? style.overflow ?? 'visible',
					overflowY: style.overflowY ?? style.overflow ?? 'visible',
				}}
				internal_accessibility={{
					role,
					state: ariaState,
				}}
				internal_mouseHandlers={mouseHandlers}
			>
				{isScreenReaderEnabled && Boolean(ariaLabel) ? (
					<ink-text>{ariaLabel}</ink-text>
				) : (
					children
				)}
			</ink-box>
		);

		// Provide this Box's background color or its inherited color to children via context
		return (
			<BackgroundContext value={effectiveBackgroundColor}>
				{boxElement}
			</BackgroundContext>
		);
	},
);

Box.displayName = 'Box';

export default Box;
