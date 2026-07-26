// utils/pagination.ts

/**
 * Walks the top-level children of the editor's DOM and determines
 * where page breaks should fall, based on cumulative rendered height.
 *
 * Returns an array of child indices where a new page begins.
 * e.g. [8, 19, 31] means page 2 starts at child index 8, page 3 at 19, etc.
 */
export function calculatePageBreaks(
  editorElement: HTMLElement,
  pageContentHeightPx: number
): number[] {
  const children = Array.from(editorElement.children) as HTMLElement[]
  const breakIndices: number[] = []

  let currentPageHeight = 0

  children.forEach((child, index) => {
    const childHeight = child.getBoundingClientRect().height

    // If this single node is taller than a whole page (rare, but possible
    // with a very long action paragraph), just let it overflow rather than
    // infinite-looping — treat it as its own page.
    if (childHeight > pageContentHeightPx) {
      if (currentPageHeight > 0) {
        breakIndices.push(index)
      }
      currentPageHeight = 0
      return
    }

    if (currentPageHeight + childHeight > pageContentHeightPx) {
      breakIndices.push(index)
      currentPageHeight = childHeight
    } else {
      currentPageHeight += childHeight
    }
  })

  return breakIndices
}

/** Fixed conversion: CSS inches are always exactly 96px, regardless of DPI/zoom. */
export const PX_PER_INCH = 96

/** Standard screenplay page: 11in tall, 1in top/bottom margins → 9in usable. */
export const PAGE_CONTENT_HEIGHT_PX = 9 * PX_PER_INCH // 864
