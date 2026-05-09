import { createRoot } from "react-dom/client"
import { App } from "./App"
import { installAnnotator, createIpcAdapter, createLocalStorageAdapter } from "@loupe/dev-annotator"
import "@loupe/dev-annotator/styles.css"

// Mount the host app first
createRoot(document.getElementById("root")!).render(<App />)

// Then mount Loupe. Storage adapter:
//   • If preload exposed window.loupeBridge → use IPC adapter (file persistence)
//   • Else fall back to localStorage (e.g. when running outside Electron)
declare global {
  interface Window {
    loupeBridge?: {
      load: () => Promise<unknown[]>
      save: (annotations: unknown[]) => Promise<void>
      openExternal?: (url: string) => Promise<void>
    }
  }
}

const bridge = window.loupeBridge

installAnnotator({
  appName: "Loupe Electron Demo",
  storage: bridge
    ? createIpcAdapter({
        // Type cast — IPC bridge returns Annotation[] at runtime; the adapter
        // signature is generic over Annotation
        load: bridge.load as never,
        save: bridge.save as never,
      })
    : createLocalStorageAdapter(),
})
