# Pretext Wars

A space-themed shooter where classic poetry is the battlefield. Built as an interactive showcase for [@chenglou/pretext](https://github.com/chenglou/pretext) -- a text layout engine that handles line-by-line typesetting with variable-width constraints.

**[Play it live](https://jameslcowan.github.io/pretext-wars/)**

## What is this?

Pretext Wars lays out Emily Dickinson poems across the screen using pretext's `layoutNextLine()` API. Planets drift through the viewport, and the text reflows around them in real time -- each frame recalculates available width per line based on the circular intersection of every planet at that Y-coordinate. You pilot a cybership through the poetry, destroying letters with projectiles while dodging alien bugs and collecting tech-themed power-ups.

The game is a stress test for pretext's layout engine: text reflows continuously as planets move, lines wrap dynamically around multiple overlapping obstacles, and destroyed characters are tracked per-offset so the layout stays coherent even as the poem gets shot apart.

## How pretext is used

The layout pipeline works like this:

1. **`prepareWithSegments(text, font, opts)`** -- preprocesses the full poem text with font metrics
2. **`layoutNextLine(prepared, cursor, availableWidth)`** -- called in a loop, producing one line at a time. The `availableWidth` changes per line based on which planets intersect that vertical position
3. For each line, planet positions are checked: the chord width of each planet's circle at the current Y is subtracted from the available space, pushing text to whichever side has more room
4. Lines are rendered as absolutely-positioned DOM elements with individual `<span>` per character for per-letter destruction and displacement effects

This gives the game its signature look: poetry that wraps and flows organically around floating planets, updating every frame.

## Features

- Real-time text reflow around moving planetary obstacles
- Per-character destruction with offset tracking
- Ship "swims" through text with per-character displacement physics
- Pretext Meteor Shower events (poem letters fly at ship with knockback)
- Procedural audio (Web Audio API)
- 10 tech-themed buffs (TypeScript, React, Docker, Rust, Python, Go, etc.)
- Boss battles with the PM
- Mobile-optimized with analog stick controls and auto-fire
- Left/right-handed joystick toggle

## Running locally

```bash
npm install
npm run dev
```

## Tech stack

- [@chenglou/pretext](https://github.com/chenglou/pretext) -- text layout engine
- TypeScript + Vite
- GSAP -- animations
- Web Audio API -- procedural sound effects
- Iconify -- devicon tech logos for buff pickups
- GitHub Pages -- hosting via GitHub Actions

## License

MIT
