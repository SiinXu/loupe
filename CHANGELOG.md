# Changelog

All notable changes to Loupe are documented here. Format roughly follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] — 2026-05-11

First npm-published release. `@loupe/dev-annotator` is the SDK; `@loupe/core` stays
internal to the monorepo (bundled into `dev-annotator`'s output).

### Fixed
- **Shadow root mounted with no styles** (`installAnnotator`): `cssText` defaulted to `""`,
  so the FAB stacked at top-left without Tailwind. Now the bundled Tailwind CSS is
  inlined into the JS bundle at build time and auto-injected into the shadow root.
  README's old `import "@loupe/dev-annotator/styles.css"` example was actively
  harmful — it leaked Tailwind preflight into the host page; removed in both
  READMEs and called out in `AGENTS.md` Common Pitfalls.
- **Silent re-install**: a second `installAnnotator` call on the same `hostId` now
  logs a `console.warn` instead of swallowing the new options. Call `destroy()`
  first to apply new options.
- **`AnnotationMessages` not re-exported** from `@loupe/core`: extension consumers
  hit a TS error; fixed.
- **Cursor restore** in annotation mode: was clobbering the host page's own
  `body { cursor }` with `""`; now snapshots and restores the original.

### Added
- **Directive AI prompts**: `generateSingleAnnotationPrompt` and the
  `actionPrompt` in `formatExportJSON` now open with a role anchor
  (*"You are fixing a UI bug in {app}…"*) instead of *"Please fix"*, include an
  explicit 5-step workflow (Locate → Read → Diagnose → Fix → Verify), and pin a
  constraints list (no refactoring adjacent code, no abstractions, ask before
  touching shared components). Screenshot reference is conditional on
  `ann.screenshot`. Multi-issue prompts also pluralise correctly and add a
  batching hint (*"group fixes by file"*).
- **`generateSingleAnnotationPrompt(ann, app?)`**: optional second arg for the
  app name in the role anchor. Backwards compatible (call sites without app
  fall back to *"the app"*).
- **`AGENTS.md`**: copy-paste prompt library for Claude Code / Cursor / Cline /
  Copilot — six setups (React+Vite, Electron multi-window, Next.js App Router,
  Pages Router, Webpack/CRA, DevTools snippet) plus a Common Pitfalls section.
- **README "Install with your AI assistant"**: three collapsible prompts for the
  most common setups.
- **`vitest`** in `@loupe/core` with 15 tests covering the new prompt shape.

### Internal
- New `scripts/build-css-module.mjs` reads `dist/styles.css` and emits
  `src/styles.generated.ts` so tsup can inline the bundled CSS at build time.
- Build order: `build:css → build:css-module → tsup → build:css` (the second
  CSS build restores `dist/styles.css` after tsup's `clean: true`).
