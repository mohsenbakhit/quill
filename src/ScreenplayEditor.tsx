import { EditorContent } from '@tiptap/react'
import { FileMenuProps } from "./utils/interfaces";

export function ScreenplayEditor({editor}: FileMenuProps) {


  return <EditorContent editor={editor} className="screenplay-page"/>
}
