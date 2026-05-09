import { useEffect, useState } from "react"

/**
 * Lightweight i18n for the extension's user-facing surfaces.
 *
 * Scope:
 *  - Popup tabs/headers/labels/descriptions
 *  - Welcome / onboarding page
 *  - Bubble action button titles + alerts
 *  - Settings labels
 *
 * NOT translated (intentional):
 *  - The AI Prompt body (`generateSingleAnnotationPrompt`) — it's instructions
 *    fed to LLMs which work best in English regardless of user UI language.
 *  - Annotation `category` / `comment` — user-authored, kept verbatim.
 *  - Source code / class names — useful as-is for grep / AI context.
 *  - Exported JSON metadata fields — machine-readable.
 */

export type Locale = "en" | "zh-CN" | "ja"

export const SUPPORTED_LOCALES: { code: Locale; name: string }[] = [
  { code: "en", name: "English" },
  { code: "zh-CN", name: "简体中文" },
  { code: "ja", name: "日本語" },
]

const DEFAULT_LOCALE: Locale = "en"

// ─── Dictionaries ─────────────────────────────────────────────────────────
//
// Keys read like "namespace.thing". `en` is the source of truth — other
// dictionaries override; missing keys fall back to English.

type Dict = Record<string, string>

const en: Dict = {
  // Header / global
  "app.name": "Loupe",
  "app.tagline": "Inspect, annotate, and fix any web UI with AI",
  "popup.totalCount": "{count} total",
  "popup.openCount": "{count} open",

  // Tabs
  "tabs.sites": "Sites",
  "tabs.guide": "Guide",
  "tabs.settings": "Settings",

  // Empty state
  "empty.title": "No annotations yet",
  "empty.hint": "Press {kbd} on any page to start",

  // OriginCard
  "card.openIssue": "Open site",
  "card.openCount": "{n} open",
  "card.orphanedCount": "{n} orphaned",
  "card.copyPrompts": "Copy AI Prompt",
  "card.copied": "Copied",
  "card.confirmClear": "Clear all annotations for {origin}?",

  // Guide panel
  "guide.howItWorks": "How it works",
  "guide.shortcuts": "Shortcuts",
  "guide.features": "Features",
  "guide.step1": "Press {kbd} on any web page to enter annotation mode",
  "guide.step2": "Hover an element — scroll wheel to pick parent / child level",
  "guide.step3": "Click → choose category → describe → {kbd} to save",
  "guide.step4": "Click a numbered marker to view, copy prompt, or file as issue",
  "guide.shortcut.toggle": "Toggle annotation mode",
  "guide.shortcut.copy": "Copy AI Prompt for current page",
  "guide.shortcut.export": "Export JSON file",
  "guide.shortcut.clear": "Clear all annotations on page",
  "guide.shortcut.save": "Save annotation in bubble",
  "guide.shortcut.close": "Close bubble",
  "guide.feature.screenshot": "Auto-capture screenshot of every annotated element",
  "guide.feature.diff": "Style diff: compare current vs. recorded CSS in one click",
  "guide.feature.prompt": "Copy single or batch AI prompts — pastable into any chat",
  "guide.feature.issue": "File as GitHub or Linear issue (configure in Settings)",
  "guide.feature.sync": "Cross-site dashboard, cross-tab live sync",
  "guide.privacy":
    "Loupe stores everything in chrome.storage.local on your device. No tracking, no servers, no accounts. API calls (when configured) go directly to your provider — keys never leave your browser.",

  // Settings
  "settings.language": "Language",
  "settings.captureOptions": "Capture Options",
  "settings.captureScreenshots": "Capture screenshots with annotations",
  "settings.issueTracker": "Issue Tracker",
  "settings.issueTracker.none": "None",
  "settings.issueTracker.github": "GitHub Issues",
  "settings.issueTracker.linear": "Linear",
  "settings.githubToken": "GitHub Personal Access Token",
  "settings.linearToken": "Linear API Key",
  "settings.defaultRepo": "Default Repo (owner/repo)",
  "settings.defaultTeam": "Linear Team ID",
  "settings.exportAll": "Export All Sites",

  // Bubble actions
  "action.fileIssue": "File as issue (GitHub/Linear)",
  "action.fileIssue.notConfigured":
    "Configure an issue tracker in extension settings first.",
  "action.fileIssue.failed": "Failed to file issue: {error}",

  // Welcome
  "welcome.heroSubtitle":
    "Annotate any web page · Export AI-ready fix prompts · Privacy first",
  "welcome.step.pin.title": "Pin Loupe to your toolbar",
  "welcome.step.pin.body":
    "Click the {puzzle} puzzle icon at the top-right of Chrome → find {strong} → click the {pin} pin.",
  "welcome.step.pin.subtitle":
    "This puts the M button in your toolbar so you can quickly check annotations across all sites.",
  "welcome.step.try.title": "Open any website and start annotating",
  "welcome.step.try.b1": "Press {kbd} to enter annotation mode (cursor turns into a crosshair)",
  "welcome.step.try.b2": "Hover over any element — scroll wheel to pick parent / child level",
  "welcome.step.try.b3": "Click → describe the issue → {kbd} to save",
  "welcome.step.shortcuts.title": "Power-user shortcuts",
  "welcome.step.handoff.title": "Hand off to your AI tool",
  "welcome.step.handoff.body":
    "Press {kbd} any time to copy a structured prompt with the element selector, computed styles, screenshot, and issue description.",
  "welcome.step.handoff.note":
    "Paste it into Claude, Cursor, Copilot, or any chat — no API key required, no vendor lock-in. Works with whatever AI you already use.",
  "welcome.step.handoff.optional":
    "Optional: add a GitHub or Linear token in Settings to file issues with one click.",
  "welcome.openSettings": "Open Settings",
  "welcome.privacyLine1": "Your annotations stay on your device · No tracking · No accounts",
  "welcome.privacyLine2":
    "API keys (if used) are stored in chrome.storage.local — calls go directly to your provider",
}

const zhCN: Dict = {
  "app.tagline": "审视、标注、AI 修复任意网页 UI",
  "popup.totalCount": "总计 {count}",
  "popup.openCount": "未解决 {count}",

  "tabs.sites": "站点",
  "tabs.guide": "指南",
  "tabs.settings": "设置",

  "empty.title": "还没有标注",
  "empty.hint": "在任意网页上按 {kbd} 开始",

  "card.openIssue": "打开站点",
  "card.openCount": "未解决 {n}",
  "card.orphanedCount": "已失效 {n}",
  "card.copyPrompts": "复制 AI Prompt",
  "card.copied": "已复制",
  "card.confirmClear": "清除 {origin} 上的全部标注？",

  "guide.howItWorks": "使用流程",
  "guide.shortcuts": "快捷键",
  "guide.features": "功能",
  "guide.step1": "在任意网页按 {kbd} 进入标注模式",
  "guide.step2": "悬停元素 — 滚轮上滚选父级、下滚选子级",
  "guide.step3": "点击 → 选分类 → 写描述 → {kbd} 保存",
  "guide.step4": "点击编号圆点查看、复制 prompt 或创建 issue",
  "guide.shortcut.toggle": "开关标注模式",
  "guide.shortcut.copy": "复制当前页面全部标注的 AI Prompt",
  "guide.shortcut.export": "导出 JSON 文件",
  "guide.shortcut.clear": "清除当前页面所有标注",
  "guide.shortcut.save": "保存标注气泡",
  "guide.shortcut.close": "关闭气泡",
  "guide.feature.screenshot": "自动捕获每个标注元素的截图",
  "guide.feature.diff": "Style Diff：一键对比标注时与当前 CSS 的差异",
  "guide.feature.prompt": "复制单条或批量 AI Prompt — 可粘贴到任意 AI 对话",
  "guide.feature.issue": "一键创建 GitHub / Linear issue（需在设置中配置）",
  "guide.feature.sync": "跨站点 Dashboard、跨标签页实时同步",
  "guide.privacy":
    "Loupe 全部数据存于本机 chrome.storage.local。无追踪、无服务器、无账户。API 调用（如配置）直连服务商 — Token 永不离开浏览器。",

  "settings.language": "语言",
  "settings.captureOptions": "捕获选项",
  "settings.captureScreenshots": "为标注自动捕获截图",
  "settings.issueTracker": "Issue 追踪器",
  "settings.issueTracker.none": "不启用",
  "settings.issueTracker.github": "GitHub Issues",
  "settings.issueTracker.linear": "Linear",
  "settings.githubToken": "GitHub Personal Access Token",
  "settings.linearToken": "Linear API Key",
  "settings.defaultRepo": "默认仓库（owner/repo）",
  "settings.defaultTeam": "Linear Team ID",
  "settings.exportAll": "导出所有站点",

  "action.fileIssue": "创建为 Issue (GitHub/Linear)",
  "action.fileIssue.notConfigured": "请先在扩展设置里配置 Issue 追踪器。",
  "action.fileIssue.failed": "创建 Issue 失败：{error}",

  "welcome.heroSubtitle": "标注任意网页 · 导出 AI 可消费的修复 Prompt · 隐私优先",
  "welcome.step.pin.title": "把 Loupe 固定到工具栏",
  "welcome.step.pin.body":
    "点击 Chrome 右上角的 {puzzle} 拼图图标 → 找到 {strong} → 点旁边的 {pin} 图钉。",
  "welcome.step.pin.subtitle": "固定后能快速访问所有站点的标注总览。",
  "welcome.step.try.title": "打开任意网站开始标注",
  "welcome.step.try.b1": "按 {kbd} 进入标注模式（光标变十字）",
  "welcome.step.try.b2": "悬停任意元素 — 滚轮选父级 / 子级",
  "welcome.step.try.b3": "点击 → 描述问题 → {kbd} 保存",
  "welcome.step.shortcuts.title": "进阶快捷键",
  "welcome.step.handoff.title": "交给你常用的 AI 工具",
  "welcome.step.handoff.body":
    "随时按 {kbd} 复制结构化 Prompt — 包含元素选择器、计算样式、截图、问题描述。",
  "welcome.step.handoff.note":
    "粘贴到 Claude、Cursor、Copilot 或任意 AI 对话 — 无需 API key、无供应商锁定，兼容你已经在用的工具。",
  "welcome.step.handoff.optional":
    "可选：在设置里配置 GitHub / Linear Token，一键提交 Issue。",
  "welcome.openSettings": "打开设置",
  "welcome.privacyLine1": "标注数据全部留在你的设备 · 无追踪 · 无账户",
  "welcome.privacyLine2":
    "API key（如启用）存于 chrome.storage.local — 调用直连服务商",
}

const ja: Dict = {
  "app.tagline": "あらゆる Web UI を AI で検査・注釈・修正",
  "popup.totalCount": "合計 {count}",
  "popup.openCount": "未解決 {count}",

  "tabs.sites": "サイト",
  "tabs.guide": "ガイド",
  "tabs.settings": "設定",

  "empty.title": "まだ注釈がありません",
  "empty.hint": "任意のページで {kbd} を押して開始",

  "card.openIssue": "サイトを開く",
  "card.openCount": "未解決 {n}",
  "card.orphanedCount": "孤立 {n}",
  "card.copyPrompts": "AI プロンプトをコピー",
  "card.copied": "コピー済み",
  "card.confirmClear": "{origin} の全注釈を削除しますか？",

  "guide.howItWorks": "使い方",
  "guide.shortcuts": "ショートカット",
  "guide.features": "機能",
  "guide.step1": "任意のページで {kbd} を押して注釈モードに入る",
  "guide.step2": "要素にホバー — スクロールで親 / 子レベルを選択",
  "guide.step3": "クリック → カテゴリ選択 → 記述 → {kbd} で保存",
  "guide.step4": "番号付きマーカーをクリックして表示・プロンプト複製・Issue 化",
  "guide.shortcut.toggle": "注釈モード切替",
  "guide.shortcut.copy": "現在ページの AI プロンプトをコピー",
  "guide.shortcut.export": "JSON エクスポート",
  "guide.shortcut.clear": "現在ページの全注釈を削除",
  "guide.shortcut.save": "バブル内で注釈を保存",
  "guide.shortcut.close": "バブルを閉じる",
  "guide.feature.screenshot": "注釈ごとに要素のスクリーンショットを自動取得",
  "guide.feature.diff": "スタイル差分:現在と保存時の CSS をワンクリックで比較",
  "guide.feature.prompt": "単一/一括 AI プロンプトのコピー — 任意のチャットに貼付可",
  "guide.feature.issue": "GitHub / Linear に Issue 化(設定で構成)",
  "guide.feature.sync": "サイト横断ダッシュボード・タブ間ライブ同期",
  "guide.privacy":
    "Loupe のデータはすべて chrome.storage.local に保存。トラッキング・サーバー・アカウント不要。API 呼び出しはプロバイダに直接 — キーがブラウザを出ることはありません。",

  "settings.language": "言語",
  "settings.captureOptions": "キャプチャ設定",
  "settings.captureScreenshots": "注釈時にスクリーンショットを取得",
  "settings.issueTracker": "Issue トラッカー",
  "settings.issueTracker.none": "なし",
  "settings.issueTracker.github": "GitHub Issues",
  "settings.issueTracker.linear": "Linear",
  "settings.githubToken": "GitHub Personal Access Token",
  "settings.linearToken": "Linear API キー",
  "settings.defaultRepo": "デフォルトリポジトリ (owner/repo)",
  "settings.defaultTeam": "Linear チーム ID",
  "settings.exportAll": "全サイトをエクスポート",

  "action.fileIssue": "Issue として登録 (GitHub/Linear)",
  "action.fileIssue.notConfigured":
    "拡張機能の設定で Issue トラッカーを先に構成してください。",
  "action.fileIssue.failed": "Issue 登録失敗:{error}",

  "welcome.heroSubtitle":
    "あらゆる Web ページに注釈 · AI 用修正プロンプトを出力 · プライバシー第一",
  "welcome.step.pin.title": "Loupe をツールバーに固定",
  "welcome.step.pin.body":
    "Chrome 右上の {puzzle} パズルアイコンをクリック → {strong} を見つけて → {pin} ピンをクリック。",
  "welcome.step.pin.subtitle": "ツールバーから全サイトの注釈にすばやくアクセス。",
  "welcome.step.try.title": "任意のサイトを開いて注釈を始める",
  "welcome.step.try.b1": "{kbd} で注釈モードへ(カーソルが十字に)",
  "welcome.step.try.b2": "要素にホバー — スクロールで親 / 子を選択",
  "welcome.step.try.b3": "クリック → 問題を記述 → {kbd} で保存",
  "welcome.step.shortcuts.title": "上級者向けショートカット",
  "welcome.step.handoff.title": "使い慣れた AI ツールに引き継ぐ",
  "welcome.step.handoff.body":
    "いつでも {kbd} で構造化プロンプトをコピー — 要素セレクタ・計算スタイル・スクショ・問題記述を含みます。",
  "welcome.step.handoff.note":
    "Claude / Cursor / Copilot など任意のチャットに貼付 — API キー不要、ベンダーロックインなし。",
  "welcome.step.handoff.optional":
    "任意:設定で GitHub / Linear トークンを構成すれば Issue 化もワンクリック。",
  "welcome.openSettings": "設定を開く",
  "welcome.privacyLine1": "注釈データはあなたの端末に留まります · トラッキングなし · アカウント不要",
  "welcome.privacyLine2":
    "API キー(使用時)は chrome.storage.local に保存 — プロバイダに直接通信",
}

const dictionaries: Record<Locale, Dict> = {
  en,
  "zh-CN": zhCN,
  ja,
}

// ─── Locale resolution ────────────────────────────────────────────────────

const STORAGE_KEY = "marker:locale"

function detectFromBrowser(): Locale {
  const lang = (navigator.language || "").toLowerCase()
  if (lang.startsWith("zh")) return "zh-CN"
  if (lang.startsWith("ja")) return "ja"
  return "en"
}

let cachedLocale: Locale | null = null
const subscribers = new Set<(loc: Locale) => void>()

export async function getLocale(): Promise<Locale> {
  if (cachedLocale) return cachedLocale
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const stored = await chrome.storage.local.get(STORAGE_KEY)
    const saved = stored[STORAGE_KEY] as Locale | undefined
    if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
      cachedLocale = saved
      return saved
    }
  }
  cachedLocale = detectFromBrowser()
  return cachedLocale
}

export async function setLocale(locale: Locale): Promise<void> {
  cachedLocale = locale
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: locale })
  }
  for (const fn of subscribers) fn(locale)
}

// ─── Translation helpers ─────────────────────────────────────────────────

function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = params[key]
    return v === undefined ? `{${key}}` : String(v)
  })
}

export function translate(key: string, params?: Record<string, string | number>, locale?: Locale): string {
  const loc = locale ?? cachedLocale ?? DEFAULT_LOCALE
  const dict = dictionaries[loc] || en
  const template = dict[key] ?? en[key] ?? key
  return format(template, params)
}

// ─── React hook ───────────────────────────────────────────────────────────

export function useT(): {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: Locale
  setLocale: (loc: Locale) => Promise<void>
} {
  const [locale, setLocaleState] = useState<Locale>(cachedLocale || DEFAULT_LOCALE)

  useEffect(() => {
    let cancelled = false
    getLocale().then((loc) => {
      if (!cancelled) setLocaleState(loc)
    })
    const handler = (loc: Locale) => setLocaleState(loc)
    subscribers.add(handler)
    // Watch chrome.storage for cross-context locale changes (popup → content script)
    let unsub: (() => void) | undefined
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      const listener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        area: string,
      ) => {
        if (area === "local" && changes[STORAGE_KEY]) {
          const next = changes[STORAGE_KEY].newValue as Locale | undefined
          if (next) {
            cachedLocale = next
            setLocaleState(next)
          }
        }
      }
      chrome.storage.onChanged.addListener(listener)
      unsub = () => chrome.storage.onChanged.removeListener(listener)
    }
    return () => {
      cancelled = true
      subscribers.delete(handler)
      unsub?.()
    }
  }, [])

  return {
    t: (key, params) => translate(key, params, locale),
    locale,
    setLocale,
  }
}
