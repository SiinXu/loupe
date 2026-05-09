import { contextBridge, ipcRenderer } from "electron"

// Bridge between renderer and main process for Loupe's storage IPC.
// The renderer wraps this in `createIpcAdapter(window.loupeBridge)`.
contextBridge.exposeInMainWorld("loupeBridge", {
  load: () => ipcRenderer.invoke("loupe:load"),
  save: (annotations: unknown) => ipcRenderer.invoke("loupe:save", annotations),
  openExternal: (url: string) => ipcRenderer.invoke("loupe:open-external", url),
})
