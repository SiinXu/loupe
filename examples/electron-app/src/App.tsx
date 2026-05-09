import "./App.css"

/**
 * Sample app UI — purposely "underdesigned" so there's something obvious to
 * annotate. Run with `pnpm start`, then press ⌘⇧X (Cmd+Shift+X) to enter
 * annotation mode and click any element.
 */
export function App() {
  return (
    <main className="page">
      <header className="hero">
        <h1>Loupe Electron Demo</h1>
        <p className="tagline">
          Press <kbd>⌘⇧X</kbd> to enter annotation mode. Click any element on this
          page to file feedback.
        </p>
      </header>

      <section className="card">
        <h2>Account</h2>
        <div className="row">
          <label htmlFor="name">Name</label>
          <input id="name" defaultValue="Siin" />
        </div>
        <div className="row">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" defaultValue="hello@example.com" />
        </div>
        <div className="row right">
          <button className="btn primary">Save</button>
          <button className="btn">Cancel</button>
        </div>
      </section>

      <section className="card">
        <h2>Recent items</h2>
        <ul className="list">
          <li>📷 Profile photo updated</li>
          <li>🔑 New API key generated</li>
          <li>📦 Build #142 succeeded</li>
          <li>⚠️ Storage 86 % full</li>
        </ul>
      </section>

      <footer className="foot">
        <small>
          Annotations persist to{" "}
          <code>~/Library/Application Support/loupe-electron-example/loupe.json</code>{" "}
          (macOS path; equivalent on other OSes).
        </small>
      </footer>
    </main>
  )
}
