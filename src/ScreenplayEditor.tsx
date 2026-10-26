import { EditorContent } from '@tiptap/react'
import type { ScreenplayLayout } from './lib/layout'
import type { FileMenuProps } from './utils/interfaces'

interface ScreenplayEditorProps extends FileMenuProps {
  layout: ScreenplayLayout | null
}

export function ScreenplayEditor({ editor, layout }: ScreenplayEditorProps) {
  const pageCount = layout?.pages.length ?? 1
  const height = `${pageCount * 11 + Math.max(pageCount - 1, 0) * 2}in`

  return (
    <div className="screenplay-page-stack" style={{ height }}>
      {layout?.pages.slice(1).map((page, index) => (
        <span
          key={page.number}
          className="screenplay-page-number"
          style={{ top: `${(index + 1) * 13 - 0.5}in` }}
        >
          Page {page.number}.
        </span>
      ))}
      <EditorContent editor={editor} className="screenplay-page" />
    </div>
  )
}
