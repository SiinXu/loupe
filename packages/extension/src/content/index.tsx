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
  // Attach to <html> (documentElement), NOT <body>. Many sites apply
  // `transform` / `will-change` / `filter` / `contain` to body or some
  // ancestor inside body, which breaks `position: fixed` for descendants.
  // Anchoring at <html> sidesteps this.
  document.documentElement.appendChild(host)

  // ─── Property-level lock against external a11y libraries ───────────────
  // Some sites (vibecafe.ai, certain Radix wrappers) bypass our
  // `aria-live="assertive"` hint and forcibly set `inert` / `aria-hidden`
  // on every body sibling — including our host. That can trigger render
  // loops in their own a11y observers (we've seen recursive React stacks
  // bottoming out on aria-hidden warnings). Lock the properties at the
  // descriptor level so any setter call is silently no-op'd, and use a
  // MutationObserver as a backup for setAttribute.
  Object.defineProperty(host, "inert", {
    get() { return false },
    set() {},
    configurable: true,
  })
  const stripExternalA11y = () => {
    HTMLElement.prototype.removeAttribute.call(host, "inert")
    HTMLElement.prototype.removeAttribute.call(host, "aria-hidden")
  }
  new MutationObserver(stripExternalA11y).observe(host, {
    attributes: true,
    attributeFilter: ["inert", "aria-hidden"],
  })

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

  // ─── Color scheme ─────────────────────────────────────────────────────
  // Loupe renders in a single, fixed light palette regardless of the host
  // page. Earlier we tried to follow the host's dark/light state; the
  // resulting cross-context theming was unreliable (CSS-var chains broke
  // through the shadow boundary on some pages, leaving filled buttons
  // invisible). Committing to one palette gives consistent contrast and
  // recognisable Loupe identity on every site.
  reactRoot.classList.remove("dark")

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
