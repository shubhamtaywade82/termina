import React, {type ReactNode, createContext, useContext} from 'react';
import deepmerge from 'deepmerge';
import alertTheme from './components/alert/theme.js';
import badgeTheme from './components/badge/theme.js';
import confirmInputTheme from './components/confirm-input/theme.js';
import multiSelectTheme from './components/multi-select/theme.js';
import orderedListTheme from './components/ordered-list/theme.js';
import progressBarTheme from './components/progress-bar/theme.js';
import selectTheme from './components/select/theme.js';
import spinnerTheme from './components/spinner/theme.js';
import statusMessageTheme from './components/status-message/theme.js';
import unorderedListTheme from './components/unordered-list/theme.js';
import textInputTheme from './components/text-input/theme.js';
import emailInputTheme from './components/email-input/theme.js';
import passwordInputTheme from './components/password-input/theme.js';
import multilineTextInputTheme from './components/multiline-text-input/theme.js';
import accordionTheme from './components/accordion/theme.js';
import autocompleteTheme from './components/autocomplete/theme.js';
import codeblockTheme from './components/code-block/theme.js';
import datatableTheme from './components/data-table/theme.js';
import dialogTheme from './components/dialog/theme.js';
import diffviewTheme from './components/diff-view/theme.js';
import dividerTheme from './components/divider/theme.js';
import gaugeTheme from './components/gauge/theme.js';
import headerTheme from './components/header/theme.js';
import jsonviewerTheme from './components/json-viewer/theme.js';
import keyhintTheme from './components/key-hint/theme.js';
import loadingbarTheme from './components/loading-bar/theme.js';
import markdownTheme from './components/markdown/theme.js';
import modalTheme from './components/modal/theme.js';
import sparklineTheme from './components/sparkline/theme.js';
import splitPaneTheme from './components/split-pane/theme.js';
import stepperTheme from './components/stepper/theme.js';
import streamingtextTheme from './components/streaming-text/theme.js';
import tableTheme from './components/table/theme.js';
import tabsTheme from './components/tabs/theme.js';
import toastTheme from './components/toast/theme.js';
import tokencounterTheme from './components/token-counter/theme.js';
import typewriterTheme from './components/typewriter/theme.js';
import treeviewTheme from './components/tree-view/theme.js';

export type Theme = {
	components: Record<string, ComponentTheme>;
};

export type ComponentTheme = {
	styles?: Record<string, (props?: any) => ComponentStyles>;
	config?: (props?: any) => Record<string, unknown>;
};

export type ComponentStyles = Record<string, unknown>;

export const defaultTheme: Theme = {
	components: {
		Alert: alertTheme,
		Badge: badgeTheme,
		ConfirmInput: confirmInputTheme,
		MultiSelect: multiSelectTheme,
		OrderedList: orderedListTheme,
		ProgressBar: progressBarTheme,
		Select: selectTheme,
		Spinner: spinnerTheme,
		StatusMessage: statusMessageTheme,
		UnorderedList: unorderedListTheme,
		TextInput: textInputTheme,
		EmailInput: emailInputTheme,
		PasswordInput: passwordInputTheme,
		MultilineTextInput: multilineTextInputTheme,
		Accordion: accordionTheme,
		Autocomplete: autocompleteTheme,
		CodeBlock: codeblockTheme,
		DataTable: datatableTheme,
		Dialog: dialogTheme,
		DiffView: diffviewTheme,
		Divider: dividerTheme,
		Gauge: gaugeTheme,
		Header: headerTheme,
		JSONViewer: jsonviewerTheme,
		KeyHint: keyhintTheme,
		LoadingBar: loadingbarTheme,
		Markdown: markdownTheme,
		Modal: modalTheme,
		Sparkline: sparklineTheme,
		SplitPane: splitPaneTheme,
		Stepper: stepperTheme,
		StreamingText: streamingtextTheme,
		Table: tableTheme,
		Tabs: tabsTheme,
		Toast: toastTheme,
		TokenCounter: tokencounterTheme,
		Typewriter: typewriterTheme,
		TreeView: treeviewTheme,
	},
};

export const ThemeContext = createContext<Theme>(defaultTheme);

export type ThemeProviderProps = {
	readonly children: ReactNode;
	readonly theme: Theme;
};

export function ThemeProvider({children, theme}: ThemeProviderProps) {
	return (
		<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
	);
}

export const extendTheme = (originalTheme: Theme, newTheme: Theme) => {
	return deepmerge(originalTheme, newTheme);
};

export const useComponentTheme = <Theme extends ComponentTheme>(
	component: string,
): Theme => {
	const theme = useContext(ThemeContext);
	return theme.components[component] as Theme;
};
