# Loupe — Install Prompts for AI Coding Assistants

This file is a copy-paste prompt library for Claude Code, Cursor, Cline, Copilot Chat, Aider, and any other LLM coding assistant. Drop any block below into the assistant and it will integrate Loupe into the host project.

All prompts assume Loupe **v0.2+** (where the bundled Tailwind CSS auto-loads into the shadow root — no manual CSS import needed).

---

## Pick the prompt that matches your project

| Project shape | Use prompt | Notes |
|---|---|---|
| Single-entry React + Vite app | [A. React / Vite](#a-react--vite-single-entry-app) | 80 % of cases |
| Electron app with multiple renderer entries (one per BrowserWindow type) | [B. Electron multi-window](#b-electron-multi-window-app) | VS Code / Cursor / Cherry Studio style |
| Next.js (App Router) | [C. Next.js App Router](#c-nextjs-app-router) | Needs `"use client"` boundary |
| Next.js (Pages Router) | [D. Next.js Pages Router](#d-nextjs-pages-router) | Mount in `_app.tsx` |
| Plain Webpack / CRA | [E. Webpack / CRA](#e-webpack--cra) | No `import.meta.env`, use `process.env.NODE_ENV` |
| Just want to see it work without installing | [F. DevTools snippet](#f-devtools-snippet-no-install) | Paste into Console |

---

## A. React / Vite (single-entry app)

```
Integrate @loupe/dev-annotator into this project so I can press ⌘⇧X in dev mode to annotate UI elements and copy AI-ready fix prompts.

1. Install: `pnpm add -D @loupe/dev-annotator` (or npm/yarn equivalent).
2. Find the React mount entry — likely main.tsx, index.tsx, or entryPoint.tsx. Look for `createRoot(` or `ReactDOM.render(`.
3. Above that mount call, add:

   if (import.meta.env.DEV) {
     const { installAnnotator } = await import("@loupe/dev-annotator")
     installAnnotator({ appName: "<my app name>" })
   }

   (Non-Vite project: swap `import.meta.env.DEV` for `process.env.NODE_ENV === "development"`.)

Constraints:
- Touch ONLY the entry file. Don't refactor adjacent code, don't reformat, don't reorder imports.
- No try/catch. Loupe is dev-only and tree-shakes out of production builds.
- Don't create a wrapper component, helper file, or config flag unless the project has multiple entries.
- Don't import "@loupe/dev-annotator/styles.css" — the SDK auto-injects its own CSS into a shadow root.

Verify: `pnpm dev`, then press ⌘⇧X. A small Loupe button appears bottom-right, and annotation mode highlights elements on hover.
```

---

## B. Electron multi-window app

```
Integrate @loupe/dev-annotator into this Electron app. Every renderer window must support Loupe.

1. Install: `pnpm add -D @loupe/dev-annotator`.
2. Grep the repo for every `createRoot(` call — Electron multi-window apps have one entry file per BrowserWindow type (main, settings, quickAssistant, selectionToolbar, migration, subWindow, etc). List them ALL before editing anything.
3. Create a shared helper at `src/renderer/dev/installLoupe.ts` (or the project's equivalent path):

   import { installAnnotator } from "@loupe/dev-annotator"

   export function installLoupe(windowName: string): void {
     if (import.meta.env.DEV) {
       installAnnotator({ appName: `<my app name> · ${windowName}` })
     }
   }

4. In each entry file, before the createRoot call, add two lines:

   import { installLoupe } from "<path to helper>"
   installLoupe("<descriptive window name>")

   Use a different window name per entry (Main, Settings, Quick Assistant, …) so exports are distinguishable.

5. Run the project's typecheck script to confirm imports resolve.

Constraints:
- Wire EVERY entry, not just the main window.
- Don't modify CSP, preload scripts, or the window manager. Loupe runs entirely in the renderer process and isolates itself via shadow DOM.
- No try/catch, no feature flag, no production guard beyond `import.meta.env.DEV`.
- Don't import "@loupe/dev-annotator/styles.css" — the SDK auto-injects CSS into its shadow root.

Verify: open each window during `pnpm dev` and press ⌘⇧X in each. Loupe overlay must appear in all of them. Annotations are stored per window (per-origin localStorage).
```

---

## C. Next.js App Router

```
Integrate @loupe/dev-annotator into this Next.js app. App Router layouts default to Server Components, so installAnnotator must run inside a Client Component.

1. Install: `pnpm add -D @loupe/dev-annotator`.
2. Create `app/loupe-installer.tsx`:

   "use client"
   import { useEffect } from "react"

   export function LoupeInstaller() {
     useEffect(() => {
       if (process.env.NODE_ENV !== "development") return
       void import("@loupe/dev-annotator").then(({ installAnnotator }) => {
         installAnnotator({ appName: "<my app name>" })
       })
     }, [])
     return null
   }

3. In `app/layout.tsx`, mount it once inside `<body>`:

   <LoupeInstaller />

Constraints:
- Don't touch next.config.* — dynamic import keeps the SDK out of the production bundle.
- Don't add error handling.
- Don't import the styles.css side-effect.

Verify: `pnpm dev`, visit any route, press ⌘⇧X.
```

---

## D. Next.js Pages Router

```
Integrate @loupe/dev-annotator into this Next.js (Pages Router) app.

1. Install: `pnpm add -D @loupe/dev-annotator`.
2. In `pages/_app.tsx`, add a useEffect that dynamic-imports the SDK and installs it in dev:

   import { useEffect } from "react"

   useEffect(() => {
     if (process.env.NODE_ENV !== "development") return
     void import("@loupe/dev-annotator").then(({ installAnnotator }) => {
       installAnnotator({ appName: "<my app name>" })
     })
   }, [])

Constraints:
- Don't import the styles.css side-effect — SDK handles its own styles.
- Don't add try/catch.
- Don't change next.config.*.

Verify: `pnpm dev` → any page → ⌘⇧X.
```

---

## E. Webpack / CRA

```
Integrate @loupe/dev-annotator into this app (Webpack-based, no Vite).

1. Install: `npm install --save-dev @loupe/dev-annotator`.
2. In the React mount file (src/index.tsx or src/main.tsx), before ReactDOM.render / createRoot:

   if (process.env.NODE_ENV === "development") {
     import("@loupe/dev-annotator").then(({ installAnnotator }) => {
       installAnnotator({ appName: "<my app name>" })
     })
   }

Constraints:
- Use process.env.NODE_ENV (not import.meta.env — CRA/Webpack don't expose it).
- Don't add the styles.css side-effect import.
- Dynamic import keeps the SDK out of production bundles.

Verify: `npm start`, press ⌘⇧X.
```

---

## F. DevTools snippet (no install)

You don't need an AI prompt for this — paste the snippet from [`examples/devtools-snippet`](./examples/devtools-snippet) into the running app's DevTools Console. Works on any web page or shipped Electron app you can open DevTools in (Slack, VS Code, Discord, …).

---

## Common pitfalls to call out to the AI

If an assistant gets confused or produces noisy diffs, append these to the prompt:

- "Do not add `import '@loupe/dev-annotator/styles.css'` — the SDK auto-injects its own CSS into a shadow root. Adding it as a side-effect leaks Loupe's Tailwind into the host page and breaks unrelated UI (hidden `<input type=file>` becoming visible, etc)."
- "Do not wrap installAnnotator in try/catch. It cannot throw in any production-relevant way; failing loudly during dev is intentional."
- "Do not pass a custom `cssText`. The bundled CSS is the default and is correct for all standard setups."
- "Do not create a separate dev-only build script, env file, or CI hook. The `import.meta.env.DEV` guard is sufficient."

---

## What Loupe gives you after install

- `⌘⇧X` / `Ctrl+Shift+X` — toggle annotation mode
- Hover element → mouse wheel to pick parent/child level → click to drop a bubble
- Each annotation generates a markdown prompt with selector + computed styles + element screenshot + React fiber breadcrumb + your description
- `⌘⇧F` — copy current-page AI prompt; paste into any chat to get a fix
- `⌘⇧E` — export annotations as JSON
- Per-origin storage in localStorage; cross-window live sync
- Shadow-DOM isolated — host styles never leak in, Loupe's Tailwind never leaks out

See [README.md](./README.md) for the full feature list and platform notes.
