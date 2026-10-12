// Registry of live preview demos shown on the documentation pages.
//
// Each entry pairs a demo component with the render options the harness needs.
// `rows` fixes the terminal height; `alternateScreen` and `mouse` are passed
// straight to `render()` — demos with mouse wheel support (ScrollBox,
// LogStream) run on the alternate screen with SGR mouse tracking enabled,
// exactly as the component docs prescribe.

import type {ComponentType} from 'react';

import AlertBasic from './alert-basic';
import BadgeBasic from './badge-basic';
import ConfirmInputBasic from './confirm-input-basic';
import EmailInputBasic from './email-input-basic';
import LogStreamBasic from './log-stream-basic';
import MultiSelectBasic from './multi-select-basic';
import OrderedListBasic from './ordered-list-basic';
import OverviewHero from './overview-hero';
import PasswordInputBasic from './password-input-basic';
import ProgressBarBasic from './progress-bar-basic';
import ScrollBoxBasic from './scroll-box-basic';
import SelectBasic from './select-basic';
import SpinnerBasic from './spinner-basic';
import StatusMessageBasic from './status-message-basic';
import TextInputBasic from './text-input-basic';
import UnorderedListBasic from './unordered-list-basic';

export type DemoDefinition = {
  component: ComponentType;
  rows: number;
  alternateScreen?: boolean;
  mouse?: boolean;
};

export const demos: Record<string, DemoDefinition> = {
  'overview-hero': {component: OverviewHero, rows: 13},
  'alert-basic': {component: AlertBasic, rows: 13},
  'badge-basic': {component: BadgeBasic, rows: 10},
  'confirm-input-basic': {component: ConfirmInputBasic, rows: 7},
  'email-input-basic': {component: EmailInputBasic, rows: 8},
  'log-stream-basic': {
    component: LogStreamBasic,
    rows: 13,
    alternateScreen: true,
    mouse: true,
  },
  'multi-select-basic': {component: MultiSelectBasic, rows: 13},
  'ordered-list-basic': {component: OrderedListBasic, rows: 11},
  'password-input-basic': {component: PasswordInputBasic, rows: 8},
  'progress-bar-basic': {component: ProgressBarBasic, rows: 7},
  'scroll-box-basic': {
    component: ScrollBoxBasic,
    rows: 14,
    alternateScreen: true,
    mouse: true,
  },
  'select-basic': {component: SelectBasic, rows: 10},
  'spinner-basic': {component: SpinnerBasic, rows: 7},
  'status-message-basic': {component: StatusMessageBasic, rows: 9},
  'text-input-basic': {component: TextInputBasic, rows: 9},
  'unordered-list-basic': {component: UnorderedListBasic, rows: 10},
};
