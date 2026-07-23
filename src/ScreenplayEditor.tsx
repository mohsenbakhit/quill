import { useEditor, EditorContent } from '@tiptap/react'
import { screenplayExtensions } from './extensions'
import { FileMenuProps } from "./utils/interfaces";

export function ScreenplayEditor({editor}: FileMenuProps) {


  return <EditorContent editor={editor} className="screenplay-page"/>
}
