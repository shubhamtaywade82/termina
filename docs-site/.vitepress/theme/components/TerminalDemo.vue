<script setup lang="ts">
// Live terminal preview card for the termina docs.
//
// Usage in markdown:
//
//     <TerminalDemo demo="text-input-basic" title="TextInput — live" />
//
// The demo id refers to an entry in ../demos/registry.ts. The heavy pieces
// (xterm.js, the termina renderer, the demo components) are loaded lazily on
// first mount, so pages without previews pay nothing.

import {onBeforeUnmount, onMounted, ref} from 'vue';
import {mountDemo, type MountedDemo} from '../terminal/mount';
import '@xterm/xterm/css/xterm.css';

const props = withDefaults(
  defineProps<{
    demo: string;
    title?: string;
  }>(),
  {
    title: 'termina — live preview',
  },
);

const screen = ref<HTMLElement>();
const state = ref<'loading' | 'running' | 'exited' | 'error'>('loading');
const focused = ref(false);
const errorMessage = ref('');

let mounted: MountedDemo | undefined;
let disposed = false;

async function start(): Promise<void> {
  state.value = 'loading';
  errorMessage.value = '';
  focused.value = false;

  try {
    const {demos} = await import('../demos/registry');
    const definition = demos[props.demo];

    if (!definition) {
      state.value = 'error';
      errorMessage.value = `Unknown demo "${props.demo}".`;
      return;
    }

    if (disposed || !screen.value) {
      return;
    }

    screen.value.replaceChildren();

    mounted = await mountDemo({
      element: screen.value,
      component: definition.component,
      rows: definition.rows,
      renderOptions: {
        alternateScreen: definition.alternateScreen,
        mouse: definition.mouse,
      },
      onExit: () => {
        state.value = 'exited';
      },
      onFocusChange: isFocused => {
        focused.value = isFocused;
      },
    });

    if (disposed) {
      mounted.dispose();
      return;
    }

    state.value = 'running';
  } catch (error) {
    console.error('[termina preview] failed to mount the demo', error);
    state.value = 'error';
    errorMessage.value =
      error instanceof Error ? error.message : String(error);
  }
}

function focusTerminal(): void {
  if (state.value === 'running') {
    mounted?.focus();
  }
}

async function restart(): Promise<void> {
  mounted?.dispose();
  mounted = undefined;
  await start();
}

onMounted(start);

onBeforeUnmount(() => {
  disposed = true;
  mounted?.dispose();
  mounted = undefined;
});
</script>

<template>
  <div class="terminal-demo" :class="{'is-focused': focused}" @click="focusTerminal">
    <div class="terminal-demo-titlebar">
      <span class="terminal-demo-dots" aria-hidden="true">
        <i class="dot dot-red" />
        <i class="dot dot-yellow" />
        <i class="dot dot-green" />
      </span>
      <span class="terminal-demo-title">{{ title }}</span>
      <span class="terminal-demo-hint">
        <template v-if="state === 'running'">
          <span v-if="focused" class="hint-live">● live — typing goes to the app</span>
          <span v-else class="hint-idle">click to interact</span>
        </template>
        <template v-else-if="state === 'loading'">loading…</template>
        <template v-else-if="state === 'exited'">the app exited</template>
        <template v-else>preview failed</template>
      </span>
    </div>

    <div class="terminal-demo-screen">
      <div ref="screen" class="terminal-demo-xterm" />

      <div v-if="state === 'exited'" class="terminal-demo-overlay">
        <p>The app exited.</p>
        <button type="button" @click.stop="restart">Restart</button>
      </div>

      <div v-else-if="state === 'error'" class="terminal-demo-overlay">
        <p>{{ errorMessage || 'The preview failed to load.' }}</p>
        <button type="button" @click.stop="restart">Retry</button>
      </div>

      <div v-else-if="state === 'loading'" class="terminal-demo-placeholder">
        <span class="blink">▊</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal-demo {
  margin: 16px 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider, #3c3c43);
  background: #0d1117;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.24);
}

.terminal-demo.is-focused {
  border-color: #f59e0b;
  box-shadow: 0 0 0 1px #f59e0b, 0 1px 6px rgba(0, 0, 0, 0.3);
}

.terminal-demo-titlebar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  background: #161b22;
  border-bottom: 1px solid #21262d;
  user-select: none;
}

.terminal-demo-dots {
  display: inline-flex;
  gap: 6px;
}

.terminal-demo-dots .dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
}

.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.terminal-demo-title {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 11.5px;
  color: #8b949e;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal-demo-hint {
  margin-left: auto;
  font-size: 11px;
  font-family: var(--vp-font-family-mono, monospace);
  color: #6e7681;
  white-space: nowrap;
}

.hint-live {
  color: #7ee787;
}

.terminal-demo-screen {
  position: relative;
  padding: 10px 12px;
  background: #0d1117;
  min-height: 76px;
}

.terminal-demo-xterm {
  overflow-x: auto;
}

.terminal-demo-xterm :deep(.xterm) {
  padding: 0;
}

.terminal-demo-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(13, 17, 23, 0.86);
  color: #e6edf3;
  font-size: 13px;
}

.terminal-demo-overlay p {
  margin: 0;
  font-family: var(--vp-font-family-mono, monospace);
}

.terminal-demo-overlay button {
  font: inherit;
  font-size: 12.5px;
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid #30363d;
  background: #21262d;
  color: #e6edf3;
  cursor: pointer;
}

.terminal-demo-overlay button:hover {
  background: #30363d;
  border-color: #f59e0b;
}

.terminal-demo-placeholder {
  display: flex;
  align-items: center;
  min-height: 56px;
  color: #6e7681;
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 12px;
}

.blink {
  animation: terminal-demo-blink 1s steps(1) infinite;
}

@keyframes terminal-demo-blink {
  50% {
    opacity: 0;
  }
}
</style>
