import { app, BrowserWindow } from "electron"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { registerLoupeMain } from "@loupe/dev-annotator/electron-main"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    webPreferences: {
      // Path resolves at runtime (dist-electron/preload.js after build)
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Dev: load Vite dev server. Prod: load compiled HTML.
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"))
  }
}

app.whenReady().then(() => {
  // Register Loupe's IPC handlers — annotations persist to a JSON file in
  // the OS-specific user-data folder (e.g. ~/Library/Application Support/<app>/loupe.json on macOS).
  registerLoupeMain({
    filePath: path.join(app.getPath("userData"), "loupe.json"),
  })

  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
