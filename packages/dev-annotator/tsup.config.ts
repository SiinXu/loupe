import { defineConfig } from "tsup"

export default defineConfig([
  // Renderer entry — runs inside the Electron renderer process or any browser.
  // We BUNDLE @loupe/core (workspace dep — annotation UI components) and its
  // primitive deps (Radix, lucide, etc.) into the output so npm consumers only
  // need React installed. No workspace / extra peer deps at consume time.
  {
    entry: { index: "src/index.tsx" },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    // Only React stays external — peer dep the consumer already has.
    // Everything else (radix-ui primitives, lucide-react icons, html-to-image,
    // class-variance-authority, etc.) gets bundled so the package is truly
    // standalone — users only `npm install @loupe/dev-annotator` + react.
    external: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
    ],
    noExternal: [/.*/], // bundle ALL non-external deps
    target: "es2022",
    treeshake: true,
    minify: false,
  },
  // Main-process helpers — Electron `main` only. Uses `electron`, `node:path`, etc.
  // Kept separate so renderer bundles don't accidentally pull in Node-only APIs.
  {
    entry: { "electron-main": "src/electron-main.ts" },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    external: ["electron"],
    target: "es2022",
  },
])
