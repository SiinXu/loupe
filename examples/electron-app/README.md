# Loupe Electron Demo

Minimal Electron app showing how to integrate **`@loupe/dev-annotator`** with **filesystem-backed persistence** via the main process.

## Run

```bash
# from the repo root
pnpm install
pnpm --filter @loupe/core build      # nothing to do — core is source-only
pnpm --filter @loupe/dev-annotator build

# now the example
cd examples/electron-app
pnpm start
```

That's it. The window opens, you see a sample app, press `⌘⇧X` (Cmd+Shift+X) to enter annotation mode, and start clicking elements.

Annotations are saved to:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/loupe-electron-example/loupe.json` |
| Windows | `%APPDATA%\loupe-electron-example\loupe.json` |
| Linux | `~/.config/loupe-electron-example/loupe.json` |

Quit and re-open — your annotations are still there.

## What's wired up

| Concern | Where | How |
|---|---|---|
| Window + IPC | `electron/main.ts` | `BrowserWindow` + `registerLoupeMain({ filePath })` from `@loupe/dev-annotator/electron-main` |
| Renderer ↔ main bridge | `electron/preload.ts` | `contextBridge.exposeInMainWorld("loupeBridge", { load, save, openExternal })` |
| Mount the annotator | `src/main.tsx` | `installAnnotator({ storage: createIpcAdapter(window.loupeBridge) })` |
| Sample UI to annotate | `src/App.tsx` | Plain HTML + CSS — Loupe's UI lives in shadow DOM and doesn't collide |

## Files at a glance

```
examples/electron-app/
├── electron/
│   ├── main.ts          # main process — registers Loupe IPC handlers
│   └── preload.ts       # exposes window.loupeBridge to renderer
├── src/
│   ├── main.tsx         # renderer entry — installAnnotator(...)
│   ├── App.tsx          # sample app UI
│   └── App.css
├── index.html
├── vite.config.ts
├── tsconfig.json        # for renderer (Vite)
├── tsconfig.electron.json   # for main + preload (tsc → dist-electron)
└── package.json
```

## Replace with your own setup

For an existing Electron app, the integration is just three things:

1. **main.ts** — `registerLoupeMain({ filePath: ... })` after `app.whenReady()`
2. **preload.ts** — `contextBridge.exposeInMainWorld("loupeBridge", ...)`
3. **renderer entry** — `installAnnotator({ storage: createIpcAdapter(window.loupeBridge) })` + `import "@loupe/dev-annotator/styles.css"`

See `packages/dev-annotator/README.md` for the full SDK docs.
