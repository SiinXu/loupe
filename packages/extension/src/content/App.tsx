import { useEffect, useMemo, useRef, useState } from "react"
import {
  AnnotationProvider,
  AnnotationOverlay,
  AnnotationToggle,
  AnnotationList,
  useAnnotations,
  type Annotation,
  type BubbleAction,
} from "@loupe/core"
import { loadAnnotationsFor, saveAnnotationsFor, onAnnotationsChanged, loadSettings } from "../shared/storage"
import { captureElementScreenshot } from "../shared/screenshot"
import { getReactSourceHint } from "../shared/fiber"
import { FileIssueAction } from "./BubbleActions"

interface ContentAppProps {
  shadowRoot: ShadowRoot
}

/**
 * Root of the content-script React app.
 *
 * The AnnotationProvider from @loupe/core still uses its localStorage
 * key internally — we use a unique bootstrap key per origin so each site has
 * an independent state. The StoragePersistence bridge then syncs to
 * chrome.storage.local for cross-tab sync and popup access.
 */
export function ContentApp({ shadowRoot }: ContentAppProps) {
  // Start with empty array — UI renders immediately. Storage hydration
  // happens async via StoragePersistence; if storage is slow/blocked, the
  // FAB still appears so the user can use the extension.
  const [initialAnnotations, setInitialAnnotations] = useState<Annotation[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const origin = window.location.origin

  useEffect(() => {
    loadAnnotationsFor(origin)
      .then((data) => {
        setInitialAnnotations(data)
        setHydrated(true)
      })
      .catch((err) => {
        // Don't block render on storage failure — log and continue with empty
        console.warn("[loupe] storage read failed:", err)
        setHydrated(true)
      })
  }, [origin])

  // Stable bubble action list — only File Issue. AI suggestions removed
  // (Copy AI Prompt covers it without needing user-managed API keys).
  const bubbleActions = useMemo<BubbleAction[]>(
    () => [{ id: "file-issue", component: FileIssueAction }],
    [],
  )

  // Portal target inside our shadow root.
  // Created synchronously once, side effects done outside React's render
  // (avoiding StrictMode double-execution surprises). useRef holds the stable
  // reference; if shadow root already has the div from a prior mount, reuse it.
  const portalContainerRef = useRef<HTMLElement | null>(null)
  if (!portalContainerRef.current) {
    const existing = shadowRoot.getElementById("marker-portal-target") as HTMLElement | null
    if (existing) {
      portalContainerRef.current = existing
    } else {
      const el = document.createElement("div")
      el.id = "marker-portal-target"
      shadowRoot.appendChild(el)
      portalContainerRef.current = el
    }
  }
  const portalContainer = portalContainerRef.current

  return (
    <AnnotationProvider
      page={getPageId()}
      boundarySelector="body"
      appName={extractAppName(origin)}
      portalContainer={portalContainer}
      disablePersistence
      disablePageFilter
      getSourceHint={fiberSourceHint}
      bubbleActions={bubbleActions}
    >
      <StoragePersistence origin={origin} initial={initialAnnotations} hydrated={hydrated} />
      <CommandBridge />
      <ScreenshotCapture />
      <AnnotationOverlay />
      <AnnotationToggle onToggleList={() => setListOpen((v) => !v)} listOpen={listOpen} />
      <AnnotationList open={listOpen} onClose={() => setListOpen(false)} />
    </AnnotationProvider>
  )
}

/**
 * Bridges AnnotationProvider's in-memory state to chrome.storage.local.
 *  - Hydrates from chrome.storage on mount
 *  - Saves on every change
 *  - Listens to remote changes (other tabs) and merges them in
 */
function StoragePersistence({
  origin,
  initial,
  hydrated,
}: {
  origin: string
  initial: Annotation[]
  hydrated: boolean
}) {
  const ctx = useAnnotations()
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (hydratedRef.current) return
    if (!hydrated) return
    if (initial.length > 0) ctx.importAnnotations(initial)
    hydratedRef.current = true
  }, [initial, ctx, hydrated])

  useEffect(() => {
    if (!hydratedRef.current) return
    saveAnnotationsFor(origin, ctx.allAnnotations).catch(console.error)
  }, [ctx.allAnnotations, origin])

  useEffect(() => {
    return onAnnotationsChanged(origin, (incoming) => {
      const existingIds = new Set(ctx.allAnnotations.map((a) => a.id))
      const fresh = incoming.filter((a) => !existingIds.has(a.id))
      if (fresh.length > 0) ctx.importAnnotations(fresh)
    })
  }, [origin, ctx])

  return null
}

/**
 * Auto-captures a PNG screenshot of the annotated element shortly after a new
 * annotation is created. Skipped if disabled in settings or if the element
 * already has a screenshot.
 */
function ScreenshotCapture() {
  const { allAnnotations, updateAnnotation } = useAnnotations()
  const processedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const settings = await loadSettings()
      if (settings.captureScreenshots === false) return

      for (const ann of allAnnotations) {
        if (ann.screenshot) continue
        if (processedIds.current.has(ann.id)) continue
        processedIds.current.add(ann.id)

        // Defer to next frame so DOM is stable
        const dataUrl = await captureElementScreenshot(ann.selector)
        if (cancelled) return
        if (dataUrl) updateAnnotation(ann.id, { screenshot: dataUrl })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [allAnnotations, updateAnnotation])

  return null
}

/**
 * Bridges chrome.runtime messages (from background's command handler) to the
 * AnnotationProvider's setEnabled. Allows the manifest-declared global
 * keyboard shortcut to work even when the page itself doesn't have focus.
 */
function CommandBridge() {
  const { enabled, setEnabled } = useAnnotations()

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return
    const handler = (msg: { type?: string }) => {
      if (msg?.type === "toggle-annotation-mode") {
        setEnabled(!enabled)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [enabled, setEnabled])

  return null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generates an extension-flavored sourceHint:
 *  - If React fiber is reachable, return the component breadcrumb (and source
 *    file from _debugSource if dev build) — most useful for AI prompts.
 *  - Otherwise fall back to the current pathname for context.
 */
function fiberSourceHint(el: HTMLElement): string {
  const fiber = getReactSourceHint(el)
  if (fiber) return fiber
  return window.location.pathname || "/"
}

function getPageId(): string {
  // Annotations carry this as a `page` field (still useful for filtering in
  // popup / exports), but the in-page list/toggle ignore page filtering
  // (disablePageFilter) so all annotations on the origin are visible.
  return window.location.pathname.replace(/\/$/, "") || "/"
}

function extractAppName(origin: string): string {
  try {
    return new URL(origin).hostname.replace(/^www\./, "")
  } catch {
    return origin
  }
}
