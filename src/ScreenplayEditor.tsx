import { EditorContent, type Editor } from '@tiptap/react'

export function ScreenplayEditor({ editor }: { editor: Editor | null }) {
  return <EditorContent editor={editor} className="screenplay-page" />
}
