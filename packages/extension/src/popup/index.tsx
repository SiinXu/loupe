import { createRoot } from "react-dom/client"
import { Popup } from "./Popup"
import "./styles.css"

// Apply color scheme synchronously before mount — minimizes flash of unstyled
// theme. Inline scripts are blocked by Manifest V3 CSP, so this lives in the
// module entry instead of an inline <script> tag in index.html.
const mq = matchMedia("(prefers-color-scheme: dark)")
const applyTheme = (m: { matches: boolean }) =>
  document.documentElement.classList.toggle("dark", m.matches)
applyTheme(mq)
mq.addEventListener("change", applyTheme)

createRoot(document.getElementById("root")!).render(<Popup />)
