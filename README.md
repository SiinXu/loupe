<div align="center">
  <img src="./packages/extension/public/icons/icon.svg" width="80" alt="Loupe" />
  <h1>Loupe</h1>
  <p><strong>Inspect, annotate, and fix any web UI with AI.</strong></p>
  <p>
    Click any element on any page → describe the issue → copy a prompt that any AI tool (Claude · Cursor · GPT · Copilot) can use to ship the fix.
  </p>
  <p>
    <em>Privacy-first · 100 % local · No accounts · No telemetry</em>
  </p>
</div>

---

## Three ways to use it

| Your situation | Use this | Setup |
|---|---|---|
| 🌐 Browsing the web, want to annotate any site | **Browser extension** | Install from Chrome Web Store *(coming soon)* or load unpacked from [`packages/extension`](./packages/extension) |
| 🛠 Your own Electron / web app in dev mode | **`@loupe/dev-annotator` SDK** | `npm i @loupe/dev-annotator` + 3 lines — see below |
| 🚀 A shipped Electron app you don't own (Slack, VSCode, Cursor…) or any site | **DevTools snippet** | Paste 8 lines into the Console — see [`examples/devtools-snippet`](./examples/devtools-snippet) |

---

## Quick start — SDK for app developers

You're building an Electron / web app and want Loupe living inside it during development. Add one dev dependency and three lines to your renderer entry. Done.

```bash
npm i -D @loupe/dev-annotator
```

```ts
// renderer entry — main.tsx / index.tsx / wherever you mount React
import { installAnnotator } from "@loupe/dev-annotator"

if (import.meta.env.DEV) {
  installAnnotator({ appName: "My App" })
}
```

Styles are inlined into the package and injected into Loupe's shadow root — no separate CSS import (a side-effect `import "@loupe/dev-annotator/styles.css"` would leak Tailwind preflight into your host page).

Run `pnpm dev` like always → Loupe button appears bottom-right of your app → press `⌘⇧X` to annotate.

Your code, your `pnpm dev`, your existing flow — Loupe just shows up in dev mode and stays out of production builds.

> Want annotations to persist to a JSON file via Electron IPC instead of `localStorage`? See [`packages/dev-annotator`](./packages/dev-annotator) for the three-file (main + preload + renderer) Electron setup.

### Install with your AI assistant

Hand any of these prompts to Claude Code / Cursor / Cline / Copilot Chat and let it wire Loupe in. Full prompt set lives in [`AGENTS.md`](./AGENTS.md).

<details>
<summary><strong>React / Vite app</strong> — single renderer entry (most common)</summary>

```
Integrate @loupe/dev-annotator into this project so I can press ⌘⇧X in dev mode to annotate UI.

1. Install: `pnpm add -D @loupe/dev-annotator` (or npm/yarn).
2. Find the React mount entry (main.tsx / index.tsx / entryPoint.tsx).
3. Above createRoot, add:

   if (import.meta.env.DEV) {
     const { installAnnotator } = await import("@loupe/dev-annotator")
     installAnnotator({ appName: "<my app name>" })
   }

   (Non-Vite: swap import.meta.env.DEV for process.env.NODE_ENV === "development".)

Constraints:
- Touch only the entry file. Don't refactor adjacent code.
- No try/catch. Dev-only; tree-shakes out of production.
- No new abstractions or config.

Verify: pnpm dev → press ⌘⇧X → Loupe button appears bottom-right.
```

</details>

<details>
<summary><strong>Electron multi-window app</strong> (VS Code / Cursor / Cherry Studio style)</summary>

```
Integrate @loupe/dev-annotator into this Electron app for ALL renderer windows.

1. Install: `pnpm add -D @loupe/dev-annotator`.
2. Grep for every `createRoot(` call — Electron multi-window apps have one entry per BrowserWindow type (main, settings, quickAssistant, etc). List them all before editing.
3. Create a shared helper, e.g. src/renderer/dev/installLoupe.ts:

   import { installAnnotator } from "@loupe/dev-annotator"
   export function installLoupe(windowName: string): void {
     if (import.meta.env.DEV) {
       installAnnotator({ appName: `<my app name> · ${windowName}` })
     }
   }

4. In each entry, before createRoot, call `installLoupe("<window name>")` with a distinguishing name.
5. Run typecheck to confirm imports resolve.

Constraints:
- Wire ALL entries — not just the main window.
- Don't touch CSP, preload, or window manager. Loupe self-isolates via shadow DOM.
- No try/catch, no feature flags, no production guards beyond import.meta.env.DEV.

Verify: open each window, press ⌘⇧X in each, confirm Loupe overlays.
```

</details>

<details>
<summary><strong>Next.js App Router</strong> — needs a client component</summary>

```
Integrate @loupe/dev-annotator into this Next.js app. App Router layouts default to Server Components, so installAnnotator must run client-side.

1. Install: `pnpm add -D @loupe/dev-annotator`.
2. Create app/loupe-installer.tsx:

   "use client"
   import { useEffect } from "react"
   export function LoupeInstaller() {
     useEffect(() => {
       if (process.env.NODE_ENV !== "development") return
       import("@loupe/dev-annotator").then(({ installAnnotator }) => {
         installAnnotator({ appName: "<my app name>" })
       })
     }, [])
     return null
   }

3. Mount <LoupeInstaller /> once in app/layout.tsx inside <body>.

Constraints:
- Don't modify next.config.* — dynamic import handles bundle separation.
- Don't add error handling. Production build won't include it.

Verify: pnpm dev → any route → ⌘⇧X opens Loupe.
```

</details>

### Why not a standalone "attach to my running app" tool?

Hard platform limit: to read DOM + React fiber (which is how Loupe locates code), the annotator must run inside the renderer process. Electron only exposes that via `--remote-debugging-port`, set at process start. So either Loupe lives inside your app (the SDK above), or it has to launch your app for you. There's no "Loupe.app attaches to whatever's running" path that also locates code — that's a constraint of Chromium's debug protocol, not a missing feature.

---

## What it does

- **Click → annotate.** Hover any element to highlight it. Mouse wheel up/down picks parent / child level so you never have to fight to land on the right node.
- **AI-ready prompt.** Every annotation generates a markdown prompt with the CSS selector, computed styles, an element screenshot, and your description. Paste into any AI chat to get a working fix.
- **Style diff.** Re-open an annotation later: Loupe compares the recorded CSS against the element's current CSS and highlights the deltas. Quick check whether the fix landed.
- **React fiber-aware source hints.** When the host is React, the prompt includes the component breadcrumb (and file:line in dev builds) — no guessing where the fix should go.
- **Shadow-DOM isolated.** Loupe lives in its own shadow root with `position: fixed; z-index: 2147483647` — host page CSS can't leak in, our Tailwind doesn't leak out.
- **Per-origin storage.** Annotations live in `chrome.storage.local` (extension) or `localStorage` / a JSON file (SDK). Cross-tab live sync. JSON export & import. Your data never leaves your machine.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘⇧X` · `Ctrl+Shift+X` | Toggle annotation mode |
| `⌘⇧F` | Copy AI Prompt for current page |
| `⌘⇧E` | Export JSON |
| `⌘⇧D` | Clear all annotations |
| `⌘Enter` | Save current bubble |
| `Esc` | Close current bubble |
| Mouse wheel (in annotation mode) | Up = parent element · Down = child element |

---

## Repository layout

```
loupe/
├── packages/
│   ├── core/              # @loupe/core — shared annotation UI library
│   ├── extension/         # @loupe/extension — Chrome / Edge browser extension
│   └── dev-annotator/     # @loupe/dev-annotator — npm SDK (Electron / web)
├── examples/
│   ├── electron-app/      # Working Electron app with file-backed persistence
│   └── devtools-snippet/  # Zero-install paste-into-DevTools loader
├── package.json           # pnpm workspace root
├── pnpm-workspace.yaml
├── LICENSE                # Apache-2.0
└── README.md
```

| Package | Description |
|---|---|
| [`@loupe/core`](./packages/core) | Shared annotation UI: provider, overlay, bubble, list, toggle. `i18n`-ready via a `messages` prop. Used by extension + SDK. |
| [`@loupe/extension`](./packages/extension) | Manifest V3 browser extension with cross-site dashboard, popup settings, welcome page, and zero-config global hotkeys. |
| [`@loupe/dev-annotator`](./packages/dev-annotator) | Drop-in SDK. `installAnnotator()` mounts the whole annotator into any renderer. Pluggable storage (localStorage / IPC for Electron filesystem). Includes `electron-main` helpers. |

---

## Develop

```bash
pnpm install                       # workspace install
pnpm build                         # build everything
pnpm build:extension               # browser extension only
pnpm build:sdk                     # npm SDK only
```

**Run the browser extension locally:** `pnpm build:extension` then load `packages/extension/dist` as an unpacked extension at `chrome://extensions`.

**Run the Electron example:** `pnpm build:sdk && cd examples/electron-app && pnpm start` — opens a window with sample UI, press `⌘⇧X` to start annotating. Annotations persist to `~/Library/Application Support/loupe-electron-example/loupe.json` (macOS path; equivalent on Windows / Linux).

**Live-edit a package while consumers run:** open two terminals — `pnpm --filter @loupe/dev-annotator dev` and the consumer's `pnpm dev` — pnpm workspace handles symlinking.

---

## Privacy & security

- Loupe **never sends any data anywhere** by default.
- Annotations live in browser storage / a local JSON file.
- The AI prompt is something **you copy to your clipboard** — Loupe doesn't call any LLM API.
- The optional GitHub / Linear "File Issue" buttons call those services **directly from your browser** with credentials you provide; nothing routes through any Loupe-operated server (there isn't one).
- Source available, license permissive — audit before deployment if your environment requires it.

---

## License

[Apache-2.0](./LICENSE) · © [Siin Xu](https://github.com/SiinXu)
