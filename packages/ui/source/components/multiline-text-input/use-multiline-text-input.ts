import {useInput, usePaste} from '@nemesis-oss/termina-core';
import {sanitizeMultiline} from '../../lib/sanitize-multiline.js';
import {type MultilineTextInputState} from './use-multiline-text-input-state.js';

export type UseMultilineTextInputProps = {
	/**
	 When disabled, user input and paste are ignored.

	 @default false
	 */
	isDisabled?: boolean;

	/**
	 Multiline text input state.
	 */
	state: MultilineTextInputState;

	/**
	 Number of rows the editor shows. Every edit and move carries it, so the viewport follows the caret.
	 */
	rows: number;
};

// Keys and paste for the multiline editor. Enter is a newline, and Ctrl+D submits. Paste goes through the same commit as typing, after the line endings and control characters are sanitised.
export const useMultilineTextInput = ({
	isDisabled = false,
	state,
	rows,
}: UseMultilineTextInputProps): void => {
	useInput(
		(input, key) => {
			if (key.tab || (input === 'c' && key.ctrl)) {
				return;
			}

			if (input === 'd' && key.ctrl) {
				state.submit();
				return;
			}

			if (key.return) {
				state.commit({type: 'newline', rows});
				return;
			}

			if (key.leftArrow) {
				state.commit({type: 'move-left', rows});
			} else if (key.rightArrow) {
				state.commit({type: 'move-right', rows});
			} else if (key.upArrow) {
				state.commit({type: 'move-up', rows});
			} else if (key.downArrow) {
				state.commit({type: 'move-down', rows});
			} else if (key.home) {
				state.commit({type: 'home', rows});
			} else if (key.end) {
				state.commit({type: 'end', rows});
			} else if (key.backspace) {
				state.commit({type: 'delete', rows});
			} else if (key.delete) {
				state.commit({type: 'delete-forward', rows});
			} else if (!key.ctrl && !key.meta) {
				// Ctrl and Alt chords are commands, not text. Ctrl+A must not type an "a".
				state.commit({
					type: 'insert',
					text: sanitizeMultiline(input),
					rows,
				});
			}
		},
		{isActive: !isDisabled},
	);

	// While a usePaste listener is mounted, paste never reaches useInput, so the editor takes it here.
	usePaste(
		(text) => {
			state.commit({
				type: 'insert',
				text: sanitizeMultiline(text),
				rows,
			});
		},
		{isActive: !isDisabled},
	);
};
