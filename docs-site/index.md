---
layout: home

hero:
  name: termina
  text: A React terminal UI, built from forks you can read
  tagline: "@fork/core is a fork of Ink 8 (React reconciler and Yoga layout). @fork/ui is a fork of ink-ui 2 (component kit), ported onto it."
  actions:
    - theme: brand
      text: Getting Started
      link: /guide/getting-started
    - theme: alt
      text: Component Reference
      link: /ui/overview
    - theme: alt
      text: API Reference
      link: /api/core

features:
  - title: Renderer with alternate screen and synchronized output
    details: Reflow-aware resize erase, DEC 2026 synchronized frames, opt-in incremental rendering, and SGR mouse routing to Box handlers.
    link: /guide/rendering
  - title: Input that matches a real terminal
    details: A lone Escape is held for a 40 ms window so split sequences stay intact. Grapheme-aware editing, bracketed paste, and a focus engine.
    link: /guide/keyboard-and-focus
  - title: A component kit on the same renderer
    details: Text inputs, selects, spinners, progress bars, scroll boxes, and a log stream, all themed through a single provider.
    link: /ui/overview
  - title: Tested against a real terminal emulator
    details: The test suite drives output through an xterm.js emulator and pseudo-terminals, not only string snapshots.
    link: /guide/testing
---
