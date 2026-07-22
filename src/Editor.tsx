import { useEditor, EditorContent } from '@tiptap/react'
import { screenplayExtensions } from './extensions'

export function ScreenplayEditor() {
  const editor = useEditor({
    extensions: screenplayExtensions,
    content: {
      type: 'doc',
      content: [
        { type: 'sceneHeading', content: [{ type: 'text', text: 'INT. COFFEE SHOP - DAY' }] },
      ],
    },
  })

  return <EditorContent editor={editor} />
}
