import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// ProseMirror measures selections when focusing; jsdom has no layout engine.
const emptyRect = () => ({
  x: 0, y: 0, width: 0, height: 0,
  top: 0, right: 0, bottom: 0, left: 0,
  toJSON: () => ({}),
})
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = emptyRect
}
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
}
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => undefined
}
if (!document.elementFromPoint) {
  document.elementFromPoint = () => document.body
}
if (!globalThis.ClipboardEvent) {
  globalThis.ClipboardEvent = class extends Event {
    clipboardData = null
  } as unknown as typeof ClipboardEvent
}
