import { useEffect, useState } from 'react'
import { ExportMenu } from './ExportMenu'
import { FileMenu } from './FileMenu'
import type { ScreenplayLayout } from '../lib/layout'
import type { FileMenuProps } from '../utils/interfaces'
import { NodeTypeBar } from './NodeTypeBar'

interface ToolbarProps extends FileMenuProps {
  layout: ScreenplayLayout | null
}

export function Toolbar({ editor, isDirty, setIsDirty, layout }: ToolbarProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageCount = layout?.pages.length ?? 1

  useEffect(() => {
    if (!editor || !layout) {
      setCurrentPage(1)
      return
    }

    const updateCurrentPage = () => {
      const blockIndex = editor.state.selection.$from.index(0)
      setCurrentPage((layout.blocks[blockIndex]?.page ?? 0) + 1)
    }

    updateCurrentPage()
    editor.on('selectionUpdate', updateCurrentPage)
    return () => {
      editor.off('selectionUpdate', updateCurrentPage)
    }
  }, [editor, layout])

  return (
    <div className="heading">
      <h1 id="title">Quill</h1>
      <div className="toolbar-controls">
        <NodeTypeBar editor={editor}>
          <div className="toolbar-menu-group">
            <FileMenu editor={editor} isDirty={isDirty} setIsDirty={setIsDirty} />
            <ExportMenu editor={editor} isDirty={isDirty} setIsDirty={setIsDirty} />
          </div>
          <div className="toolbar-divider" aria-hidden="true" />
        </NodeTypeBar>
        <div className="status-bar">
          Page {currentPage} of {pageCount}
        </div>
      </div>
    </div>
  )
}
