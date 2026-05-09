# Loupe

> Inspect, annotate, and fix any web UI with AI.

Click any element on any page → describe the issue → copy a structured prompt that any AI tool (Claude, Cursor, GPT, Copilot) can use to ship the fix. Privacy-first, all local, no accounts.

This monorepo contains:

| Package | What it is | Where it ships |
|---|---|---|
| [`@loupe/extension`](./packages/extension) | Chrome / Edge browser extension. Works on any `https://` page. | Chrome Web Store |
| [`@loupe/dev-annotator`](./packages/dev-annotator) | Drop-in SDK for any Electron renderer or web app. One-line install. | npm |
| [`@loupe/core`](./packages/core) | Shared annotation UI library. Used by both consumers above. | (internal — vendored on publish) |

---

## Quick links

- **Browser extension** → [packages/extension/README.md](./packages/extension/README.md)
- **Electron / Web SDK** → [packages/dev-annotator/README.md](./packages/dev-annotator/README.md)

---

## What it does

| | |
|---|---|
| 💬 Click → annotate | Hover any element to highlight (scroll wheel to pick parent / child level), click to add a structured comment with category + preset templates |
| 📋 AI Prompt | Each annotation auto-generates a markdown prompt with selector, computed styles, screenshot, breadcrumb — paste into Claude / GPT / Cursor |
| 📸 Auto screenshot | Captures a PNG of every annotated element, embedded in exports |
| ⚖️ Style diff | View an annotation later: it compares saved CSS vs. current CSS, highlights changed values |
| 🌳 React fiber | Source hints include component name + file:line (dev builds) when host is React |
| 🌐 i18n | English / 简体中文 / 日本語 |
| 🌗 Light / dark | Follows host page `<html class="dark">` or system preference |

---

## Keyboard shortcuts

| | |
|---|---|
| `⌘⇧X` / `Ctrl+Shift+X` | Toggle annotation mode |
| `⌘⇧F` | Copy AI Prompt for current page |
| `⌘⇧E` | Export JSON |
| `⌘⇧D` | Clear all annotations |
| `⌘Enter` | Save annotation |
| `Esc` | Close bubble |
| Mouse wheel (in annotation mode) | Up = parent element, Down = child element |

---

## Repo layout

```
loupe/
├── packages/
│   ├── core/                # @loupe/core — shared annotation UI library
│   ├── extension/           # @loupe/extension — browser extension
│   └── dev-annotator/       # @loupe/dev-annotator — npm SDK
├── package.json             # workspace root
├── pnpm-workspace.yaml
├── LICENSE                  # Apache-2.0
└── README.md
```

---

## Develop

```bash
pnpm install
pnpm build              # build all packages
pnpm build:extension    # build just the Chrome extension
pnpm build:sdk          # build just the npm SDK
```

After building the extension, load `packages/extension/dist` as an unpacked extension in `chrome://extensions`.

---

## License

[Apache-2.0](./LICENSE) · © Siin Xu
