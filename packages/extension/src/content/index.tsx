import { createRoot } from "react-dom/client"
import { ContentApp } from "./App"
import cssText from "./styles.css?inline"

// ─── Mount point ────────────────────────────────────────────────────────────
//
// We attach a single host element to <body>, then create a closed shadow root
// inside it. All annotation UI lives in the shadow DOM so the host page CSS
// can't leak in and our Tailwind doesn't leak out.

const HOST_ID = "marker-extension-host"

function mount(): void {
  // Don't mount twice (e.g. on SPA navigation that re-runs the script)
  if (document.getElementById(HOST_ID)) return

  const host = document.createElement("div")
  host.id = HOST_ID
  // Mark as annotation UI — events bubbling out of shadow root retarget to
  // this host element, and the overlay's `closest("[data-annotation-ui]")`
  // check uses this attribute to skip self-clicks.
  host.setAttribute("data-annotation-ui", "")
  // The `aria-hidden` npm package (used by Radix Dialog and many a11y libs)
  // treats elements with `aria-live="assertive"` as "portal nodes" and skips
  // them when hiding siblings. Without this, host pages that open dialogs
  // log warnings every time they try to hide our shadow host.
  host.setAttribute("aria-live", "assertive")
  // Host element is fixed-position invisible — children inside shadow DOM
  // will use position: fixed to render at full viewport.
  host.style.cssText =
    "all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;"
  // Attach to <html> (documentElement), NOT <body>. Key reason: many sites
  // apply `transform`, `will-change`, `filter`, or `contain` to body or some
  // ancestor inside body — that breaks `position: fixed` for descendants
  // (they end up positioned relative to that ancestor instead of viewport,
  // potentially off-screen or clipped). Anchoring at <html> sidesteps this.
  // The `aria-live="assertive"` attribute below makes a11y libraries that
  // walk body.children skip us anyway, so the earlier "not contained inside
  // body" warning no longer fires.
  document.documentElement.appendChild(host)

  const shadow = host.attachShadow({ mode: "open" })

  // Inject styles. Important: rewrite `:root` to `:host, :root` so the theme
  // CSS variables (defined under `:root` in @loupe/core/theme.css)
  // actually apply inside the shadow tree — otherwise our colors fallback to
  // unset and the UI looks broken (transparent/black on black).
  const styleEl = document.createElement("style")
  // Only rewrite bare `:root {` (light theme block in @loupe/core/theme.css).
  // Tailwind v4 already emits `:root,:host{...}` so its own rules are skipped.
  styleEl.textContent = cssText.replace(/:root(\s*)\{/g, ":host, :root$1{")
  shadow.appendChild(styleEl)

  // React mount target inside shadow
  const reactRoot = document.createElement("div")
  reactRoot.id = "marker-root"
  shadow.appendChild(reactRoot)

  // ─── Color scheme (light/dark) ──────────────────────────────────────────
  // The theme CSS defines `.dark { ... }` overrides. Since shadow DOM is its
  // own scope, we toggle a `dark` class on the React root so descendants
  // pick up the overrides.
  //
  // Resolution order:
  //   1. user override (Settings → Theme: light | dark)  takes priority
  //   2. host page signals: <html|body> class="dark" / data-theme="dark"
  //   3. OS  prefers-color-scheme: dark
  let userTheme: "auto" | "light" | "dark" = "auto"

  const detectHostDark = (): boolean => {
    const htmlEl = document.documentElement
    const bodyEl = document.body
    const hostFlagged =
      htmlEl.classList.contains("dark") ||
      htmlEl.getAttribute("data-theme") === "dark" ||
      (bodyEl?.classList.contains("dark") ?? false) ||
      bodyEl?.getAttribute("data-theme") === "dark"
    if (hostFlagged) return true
    return matchMedia("(prefers-color-scheme: dark)").matches
  }

  const applyColorScheme = () => {
    const dark = userTheme === "dark" || (userTheme === "auto" && detectHostDark())
    reactRoot.classList.toggle("dark", dark)
  }

  // Hydrate user override from chrome.storage, then react to settings changes
  if (chrome?.storage?.local) {
    chrome.storage.local.get("marker:settings", (result) => {
      const t = (result["marker:settings"] as { theme?: typeof userTheme } | undefined)?.theme
      if (t === "light" || t === "dark" || t === "auto") userTheme = t
      applyColorScheme()
    })
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes["marker:settings"]) return
      const t = (changes["marker:settings"].newValue as { theme?: typeof userTheme } | undefined)?.theme
      userTheme = t === "light" || t === "dark" ? t : "auto"
      applyColorScheme()
    })
  }

  applyColorScheme()
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyColorScheme)
  // Watch host page <html> + <body> for class/theme attribute changes so
  // dark-mode toggles on the host (e.g. Claude.ai's theme switch) propagate
  // immediately when userTheme is "auto".
  const themeObserver = new MutationObserver(applyColorScheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  })
  if (document.body) {
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    })
  }

  createRoot(reactRoot).render(<ContentApp shadowRoot={shadow} />)

  // Diagnostic marker: helps confirm the script ran on this page when
  // troubleshooting. Search the console for "Loupe" if the FAB doesn't appear.
  console.info(
    "%c[Loupe]%c content script loaded · " + window.location.origin,
    "background:#000;color:#fff;padding:1px 5px;border-radius:3px;font-weight:600;",
    "color:#999;",
  )
}

// On SPA re-navigation chrome may not re-run the script; use a single mount.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true })
} else {
  mount()
}
