/**
 * @loupe/core — shared annotation UI library.
 *
 * Used by both `@loupe/extension` (Chrome extension) and `@loupe/dev-annotator`
 * (drop-in SDK). The dev-annotator bundles this into its dist for npm publish;
 * the extension imports it as a workspace dep.
 */

export {
  AnnotationProvider,
  useAnnotationContext,
  useAnnotationContext as useAnnotations,
} from "./annotations/annotation-provider"
export { AnnotationOverlay } from "./annotations/annotation-overlay"
export { AnnotationBubble } from "./annotations/annotation-bubble"
export { AnnotationToggle } from "./annotations/annotation-toggle"
export { AnnotationList } from "./annotations/annotation-list"
export type {
  Annotation,
  AnnotationCategory,
  AnnotationContextValue,
  AnnotationMessages,
  BubbleAction,
  CapturedStyles,
} from "./annotations/types"
export { DEFAULT_ANNOTATION_MESSAGES } from "./annotations/types"
export {
  generateSingleAnnotationPrompt,
  computeStyleDiff,
  parseImportJSON,
} from "./annotations/utils"

// Re-export the minimal UI primitives so consumers (extension popup, etc.)
// can use the same Button / Badge / Tabs / DropdownMenu / Switch.
export { Button, buttonVariants } from "./ui/button"
export { Badge, badgeVariants } from "./ui/badge"
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from "./ui/dropdown-menu"
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from "./ui/tabs"
export { Switch } from "./ui/switch"
