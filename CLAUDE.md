# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Philosophical Council** is a single-file React/TypeScript application (`philosophical-council.tsx`) that simulates AI-powered debates between 14 historical philosophers and thinkers. Users submit questions, select council members, and watch (or join) debates rendered with custom SVG avatars, per-philosopher ambient audio, and a save/PDF export system.

## Architecture

### Single-File Design
The entire application lives in `philosophical-council.tsx` (~1,542 lines). There is no build system, package.json, or test suite — it is designed to be imported as a TSX component into any React environment. The file is organized as:

1. **Sound Engine** (lines 4–79) — Web Audio API synthesis. Each philosopher has a unique ambient soundscape built from oscillators, brown/white noise, and filters. `createAmbience(key)` returns a start/stop object.
2. **SVG Body Components** (lines 82–780) — 14 custom SVG React components (`CamusBody`, `KafkaBody`, etc.), each accepting a `gesture` prop (`"speak" | "point" | "idle"`) that alters colors and stroke animations.
3. **Data Layer** (lines 783–842) — `ALL_PHILOSOPHERS` maps philosopher keys to name, era, accent color, SVG component, available gestures, and a detailed character system prompt. `PHILOSOPHER_BIOS` holds bios for PDF generation.
4. **PDF Generation** (lines 845–964) — `generateDebatePDF()` builds a print-ready HTML document client-side and opens the browser print dialog.
5. **Claude API Integration** (lines 985–999) — `callClaude()` posts to `https://api.anthropic.com/v1/messages` using model `claude-sonnet-4-20250514`. `buildDebatePrompt()` classifies questions as "light" or "deep" and structures the JSON-output request. `generateSummary()` synthesizes a 2–3 sentence post-debate summary.
6. **UI Components** (lines 1002–1150) — `ProfileScreen`, `LibraryScreen`, `JournalModal`.
7. **Main `App` Component** (lines 1152–1542) — all state, effects, screen routing, and debate interaction logic.

### External Dependencies
- `window.storage` — an IndexedDB wrapper expected to be injected by the host environment. Methods used: `.get(key)`, `.set(key, value)`, `.delete(key)`, `.list(prefix)`.
- Anthropic API key — must be available when `callClaude()` constructs its `Authorization` header (check the header construction in the function for how the key is sourced).

### State & Data Flow
- Screen routing: `loading → profile → intro → debate → library`
- Debate turns are stored as `{philosopher: string, text: string}[]`; user turns use key `"user"`.
- Debates are persisted under `"debate:<timestamp>"` keys; profile under `"council-profile"`.
- Token budget scales with council size (see `tokenBudget()` around line 1230).

### Character Prompts
Each philosopher's `prompt` field in `ALL_PHILOSOPHERS` is a detailed system prompt that explicitly preserves historical contradictions and blind spots. When editing these, maintain the DO NOT sanitize / preserve authentic voice intent — this is a core design principle.

### Styling
All styles are inline or via `<style>` tags injected into the component. Color palette centers on dark browns (`#0e0b08`, `#1a1208`) with gold/amber accents (`#c9a84c`, `#e8d5a3`). Each philosopher has an `accent` hex color used for bubble theming and stage lighting.
