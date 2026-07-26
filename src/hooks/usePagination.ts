// hooks/usePagination.ts
import { useEffect, useState } from 'react'
import { Editor } from '@tiptap/react'
import { calculatePageBreaks, PAGE_CONTENT_HEIGHT_PX } from '../utils/pagination'

export function usePagination(editor: Editor | null) {
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!editor) return
    const currentEditor = editor

    let breakIndices: number[] = []

    function recalculateBreaks() {
      requestAnimationFrame(() => {
        if (!editor) return
        const dom = editor.view.dom as HTMLElement
        breakIndices = calculatePageBreaks(dom, PAGE_CONTENT_HEIGHT_PX)
        setPageCount(breakIndices.length + 1)
        recalculateCurrentPage()
      })
    }

    function recalculateCurrentPage() {
      const nodeIndex = currentEditor.state.selection.$from.index(0)
      const page = breakIndices.filter(b => b <= nodeIndex).length + 1
      setCurrentPage(page)
    }

    recalculateBreaks()

    currentEditor.on('update', recalculateBreaks)
    currentEditor.on('selectionUpdate', recalculateCurrentPage)
    return () => {
      currentEditor.off('update', recalculateBreaks)
      currentEditor.off('selectionUpdate', recalculateCurrentPage)
    }
  }, [editor])

  return { pageCount, currentPage }
}
