# Loupe DevTools Snippet

Use Loupe on **any app that exposes Chrome DevTools** — without modifying the source, rebuilding, or installing anything.

Works for:
- Already-shipped Electron apps (Slack, VSCode, Discord, Cursor, your own packaged Electron apps…)
- Live websites you don't own
- Internal admin panels
- Anything else that renders with Chromium and lets you open DevTools

---

## How

1. **Open the app or page**
2. **Open DevTools**
   - macOS: `⌘⌥I`  ·  Windows/Linux: `Ctrl+Shift+I`
   - In Electron apps: usually the same shortcut, sometimes via View → Toggle Developer Tools
3. **Paste the snippet** into the Console (or save it under Sources → Snippets for re-use)
4. **Press Enter** — you'll see `[Loupe] injected — press ⌘⇧X to start annotating`
5. **Press `⌘⇧X`** (or `Ctrl⇧X`) anywhere in the app to start

That's it. Click any element, describe the issue, copy the AI prompt.

---

## The snippet

```js
;(async () => {
  if (window.__loupeInstalled) return
  window.__loupeInstalled = true
  const BASE = "https://cdn.jsdelivr.net/npm/@loupe/dev-annotator@latest/dist"
  const [css, mod] = await Promise.all([
    fetch(`${BASE}/styles.css`).then((r) => r.text()),
    import(/* @vite-ignore */ `${BASE}/index.js`),
  ])
  mod.installAnnotator({
    appName: document.title?.slice(0, 60) || location.hostname || "app",
    cssText: css,
  })
  console.info("%c[Loupe]%c ready — ⌘⇧X to annotate", "background:#000;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600;", "color:#999;")
})()
```

[Full version with error handling →](./inject.js)

---

## Caveats

| | |
|---|---|
| **Storage is per-session** | Annotations live in `localStorage`. They survive reloads of the same page, but closing the app loses them unless you `⌘⇧E` (export JSON) first. |
| **CSP-locked apps** | Some apps (like certain banking sites or Cursor's main shell) block remote `import` via Content-Security-Policy. The snippet will fail with a CSP error in console. Workaround: paste the bundled JS inline (see "Self-hosted bundle" below). |
| **DevTools blocked** | A small number of Electron apps disable DevTools in production. Nothing this snippet can do — the platform won't let you in. |
| **Zero persistence to filesystem** | This is the no-install path. For real file-backed storage in your own Electron app, integrate the SDK ([see `examples/electron-app`](../electron-app)). |

---

## Self-hosted bundle (CSP-strict apps)

If `cdn.jsdelivr.net` is blocked:

1. `cd packages/dev-annotator && pnpm build`
2. Serve `dist/index.js` and `dist/styles.css` from a local file server (or paste them inline)
3. Replace the `BASE` URL in the snippet

Or fully inline: concat the contents of `dist/styles.css` into a `cssText` variable and the contents of `dist/index.js` directly in the Console (it's ~2 MB — works in Chrome's Console fine, just slow to paste).

---

## Compared to the SDK integration

| | DevTools Snippet | SDK (`@loupe/dev-annotator`) |
|---|---|---|
| **Works on shipped apps?** | ✅ Yes | ❌ Need source access + rebuild |
| **Setup time** | 5 seconds, paste once | ~10 lines, requires build pipeline |
| **Persistence** | localStorage only | Filesystem via Electron main process IPC |
| **Cross-window sync** | ❌ | ✅ |
| **Survives app update** | Re-paste each time | Built into your app |

For your own dev workflow → SDK. For poking at someone else's app → snippet.
