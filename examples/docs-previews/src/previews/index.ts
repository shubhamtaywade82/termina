// Every fixture module, in one list. The generator collects `previews` from each. Add a module here when you add a file.
import type {Preview} from '../preview.js';
import {previews as gettingStarted} from './getting-started.js';
import {previews as rendering} from './rendering.js';
import {previews as layoutAndText} from './layout-and-text.js';
import {previews as resize} from './resize.js';
import {previews as keyboardAndFocus} from './keyboard-and-focus.js';
import {previews as mouse} from './mouse.js';
import {previews as terminalFeatures} from './terminal-features.js';
import {previews as alternateScreenAndSuspend} from './alternate-screen-and-suspend.js';
import {previews as testing} from './testing.js';
import {previews as uiTheming} from './ui-theming.js';
import {previews as indexHome} from './index-home.js';

export const previews: readonly Preview[] = [
	...gettingStarted,
	...rendering,
	...layoutAndText,
	...resize,
	...keyboardAndFocus,
	...mouse,
	...terminalFeatures,
	...alternateScreenAndSuspend,
	...testing,
	...uiTheming,
	...indexHome,
];
