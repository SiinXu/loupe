import { describe, expect, it } from "vitest"
import type { Annotation } from "./types"
import { formatExportJSON, generateSingleAnnotationPrompt } from "./utils"

const baseAnnotation: Annotation = {
  id: "ann-1",
  selector: ".target",
  elementLabel: "<button>",
  breadcrumb: "main > Settings > SaveButton",
  comment: "Padding too tight on the save button",
  category: "style",
  page: "/settings",
  sourceHint: "src/features/settings/SaveButton.tsx",
  position: { x: 0.5, y: 0.5 },
  rect: { width: 120, height: 32 },
  computedStyles: {
    fontSize: "14px",
    fontWeight: "500",
    lineHeight: "20px",
    color: "rgb(34, 34, 34)",
    backgroundColor: "rgb(255, 255, 255)",
    padding: "4px 8px",
    margin: "0",
    border: "1px solid #ccc",
    borderRadius: "6px",
    display: "inline-flex",
    width: "120px",
    height: "32px",
    gap: "normal",
  },
  className: "save-button primary",
  timestamp: "2026-05-11T12:00:00Z",
}

describe("generateSingleAnnotationPrompt", () => {
  it("opens with the imperative role anchor (no Please-fix politeness)", () => {
    const out = generateSingleAnnotationPrompt(baseAnnotation)
    expect(out).toMatch(/^You are fixing a UI bug in /)
    expect(out).not.toMatch(/^Please fix/)
  })

  it("substitutes the app name when provided", () => {
    expect(generateSingleAnnotationPrompt(baseAnnotation, "cherry-studio")).toMatch(
      /in the cherry-studio app\b/,
    )
    expect(generateSingleAnnotationPrompt(baseAnnotation)).toMatch(/in the app\b/)
  })

  it("includes the 5-step explicit workflow", () => {
    const out = generateSingleAnnotationPrompt(baseAnnotation)
    expect(out).toContain("Workflow:")
    expect(out).toMatch(/1\. Locate:/)
    expect(out).toMatch(/2\. Read:/)
    expect(out).toMatch(/3\. Diagnose:/)
    expect(out).toMatch(/4\. Fix:/)
    expect(out).toMatch(/5\. Verify:/)
  })

  it("includes the constraints list that guards against AI scope creep", () => {
    const out = generateSingleAnnotationPrompt(baseAnnotation)
    expect(out).toContain("Constraints:")
    expect(out).toContain("Touch ONLY")
    expect(out).toContain("Do NOT refactor")
    expect(out).toContain("Do NOT add abstractions")
    expect(out).toContain("stop and ask first")
  })

  it("uses className for the grep hint when present", () => {
    const out = generateSingleAnnotationPrompt(baseAnnotation)
    expect(out).toContain("grep for `save-button primary`")
  })

  it("falls back to elementLabel for the grep hint when className is missing", () => {
    const out = generateSingleAnnotationPrompt({ ...baseAnnotation, className: undefined })
    expect(out).toContain("grep for `<button>`")
  })

  it("mentions the screenshot only when one is attached", () => {
    expect(generateSingleAnnotationPrompt(baseAnnotation)).not.toContain("screenshot")
    const withShot = generateSingleAnnotationPrompt({
      ...baseAnnotation,
      screenshot: "data:image/png;base64,xxx",
    })
    expect(withShot).toContain("A screenshot of the offending element is attached")
  })

  it("renders the category-appropriate style block", () => {
    const styleOut = generateSingleAnnotationPrompt(baseAnnotation)
    expect(styleOut).toContain("Current styles")
    expect(styleOut).toContain("fontWeight=500")

    const layoutOut = generateSingleAnnotationPrompt({ ...baseAnnotation, category: "layout" })
    expect(layoutOut).toContain("Current layout")
    expect(layoutOut).toContain("display=inline-flex")

    const bugOut = generateSingleAnnotationPrompt({ ...baseAnnotation, category: "bug" })
    expect(bugOut).toContain("Key styles")
  })
})

describe("formatExportJSON.actionPrompt", () => {
  const actionPromptOf = (anns: Annotation[], app = "cherry-studio") => {
    const parsed = JSON.parse(formatExportJSON(anns, app))
    return parsed.actionPrompt as string
  }

  it("returns a no-op message when nothing is unresolved", () => {
    expect(actionPromptOf([{ ...baseAnnotation, resolved: true }])).toBe(
      "All annotations resolved. No action needed.",
    )
    expect(actionPromptOf([])).toBe("All annotations resolved. No action needed.")
  })

  it("uses singular 'bug' for one issue and 'bugs' for many", () => {
    expect(actionPromptOf([baseAnnotation])).toMatch(/fixing 1 UI bug\b/)
    expect(actionPromptOf([baseAnnotation, { ...baseAnnotation, id: "ann-2" }])).toMatch(
      /fixing 2 UI bugs\b/,
    )
  })

  it("opens with the role anchor, not 'Please fix'", () => {
    const out = actionPromptOf([baseAnnotation])
    expect(out).toMatch(/^You are fixing /)
    expect(out).not.toMatch(/^Please fix/)
  })

  it("includes screenshots line only when at least one annotation has a screenshot", () => {
    expect(actionPromptOf([baseAnnotation])).not.toContain("Screenshots of the offending elements")
    expect(
      actionPromptOf([{ ...baseAnnotation, screenshot: "data:image/png;base64,xxx" }]),
    ).toContain("Screenshots of the offending elements are attached")
  })

  it("groups issues by page", () => {
    const a = baseAnnotation
    const b = { ...baseAnnotation, id: "ann-2", page: "/about" }
    const out = actionPromptOf([a, b])
    expect(out).toContain("## Page: /settings")
    expect(out).toContain("## Page: /about")
  })

  it("includes the workflow, batching guidance, and constraints", () => {
    const out = actionPromptOf([baseAnnotation])
    expect(out).toContain("Workflow (per issue):")
    expect(out).toMatch(/1\. Locate:/)
    expect(out).toMatch(/5\. Verify:/)
    expect(out).toContain("Batching: group fixes by file")
    expect(out).toContain("Constraints:")
    expect(out).toContain("Touch ONLY the components")
    expect(out).toContain("stop and ask first")
  })

  it("substitutes the app name", () => {
    expect(actionPromptOf([baseAnnotation], "my-app")).toMatch(/in the my-app app\b/)
  })
})
