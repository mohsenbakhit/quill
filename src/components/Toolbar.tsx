import { Editor } from "@tiptap/react";

interface ToolbarProps {
  editor: Editor | null
}
export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;
  return (
      <button onClick={() => editor.chain().focus().setNode('character').run()}>
        Character
      </button>
    )
}
