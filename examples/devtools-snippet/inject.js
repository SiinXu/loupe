/**
 * Loupe DevTools injection snippet
 * ─────────────────────────────────
 * Paste this into the Console (or save as a Snippet under Sources → Snippets)
 * of any app that exposes Chrome DevTools — including most Electron apps and
 * any web page. Loupe attaches to the current renderer; press ⌘⇧X / Ctrl⇧X
 * to start annotating.
 *
 * No source-code changes, no rebuild, no install. Single shot.
 */
;(async () => {
  if (window.__loupeInstalled) {
    console.warn("[Loupe] already installed on this page")
    return
  }
  window.__loupeInstalled = true

  // jsDelivr serves files from the @loupe/dev-annotator npm package.
  // To pin a version: replace `@latest` with e.g. `@0.1.0`.
  const BASE = "https://cdn.jsdelivr.net/npm/@loupe/dev-annotator@latest/dist"

  try {
    const [css, mod] = await Promise.all([
      fetch(`${BASE}/styles.css`).then((r) => {
        if (!r.ok) throw new Error(`CSS ${r.status}`)
        return r.text()
      }),
      import(/* @vite-ignore */ `${BASE}/index.js`),
    ])

    mod.installAnnotator({
      appName: document.title?.slice(0, 60) || location.hostname || "app",
      cssText: css,
    })

    // Visible confirmation in the console
    console.info(
      "%c[Loupe]%c injected — press ⌘⇧X (or Ctrl⇧X) to start annotating",
      "background:#000;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600;",
      "color:#999;",
    )
  } catch (err) {
    console.error(
      "[Loupe] injection failed:",
      err,
      "\n\nIf this app's CSP blocks remote modules, try a self-hosted build instead.",
    )
    window.__loupeInstalled = false
  }
})()
