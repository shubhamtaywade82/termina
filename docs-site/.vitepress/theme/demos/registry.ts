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
import AccordionBasic from './accordion-basic';
import AutocompleteBasic from './autocomplete-basic';
import CodeBlockBasic from './code-block-basic';
import DataTableBasic from './data-table-basic';
import DialogBasic from './dialog-basic';
import DiffViewBasic from './diff-view-basic';
import DividerBasic from './divider-basic';
import GaugeBasic from './gauge-basic';
import HeaderBasic from './header-basic';
import JSONViewerBasic from './json-viewer-basic';
import KeyHintBasic from './key-hint-basic';
import LoadingBarBasic from './loading-bar-basic';
import MarkdownBasic from './markdown-basic';
import SparklineBasic from './sparkline-basic';
import StepperBasic from './stepper-basic';
import StreamingTextBasic from './streaming-text-basic';
import TableBasic from './table-basic';
import TabsBasic from './tabs-basic';
import ToastBasic from './toast-basic';
import TokenCounterBasic from './token-counter-basic';
import TypewriterBasic from './typewriter-basic';
import TreeViewBasic from './tree-view-basic';

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
  'accordion-basic': {component: AccordionBasic, rows: 12},
  'autocomplete-basic': {component: AutocompleteBasic, rows: 12},
  'code-block-basic': {component: CodeBlockBasic, rows: 12},
  'data-table-basic': {component: DataTableBasic, rows: 12},
  'dialog-basic': {component: DialogBasic, rows: 12},
  'diff-view-basic': {component: DiffViewBasic, rows: 12},
  'divider-basic': {component: DividerBasic, rows: 12},
  'gauge-basic': {component: GaugeBasic, rows: 12},
  'header-basic': {component: HeaderBasic, rows: 12},
  'json-viewer-basic': {component: JSONViewerBasic, rows: 12},
  'key-hint-basic': {component: KeyHintBasic, rows: 12},
  'loading-bar-basic': {component: LoadingBarBasic, rows: 12},
  'markdown-basic': {component: MarkdownBasic, rows: 12},
  'sparkline-basic': {component: SparklineBasic, rows: 12},
  'stepper-basic': {component: StepperBasic, rows: 12},
  'streaming-text-basic': {component: StreamingTextBasic, rows: 12},
  'table-basic': {component: TableBasic, rows: 12},
  'tabs-basic': {component: TabsBasic, rows: 12},
  'toast-basic': {component: ToastBasic, rows: 12},
  'token-counter-basic': {component: TokenCounterBasic, rows: 12},
  'typewriter-basic': {component: TypewriterBasic, rows: 12},
  'tree-view-basic': {component: TreeViewBasic, rows: 12},
};
