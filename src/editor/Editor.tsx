// src/Tiptap.tsx
import { useEditor, EditorContent, EditorContext } from '@tiptap/react'
import { FloatingMenu, BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, useCallback, useMemo } from "react";
import { BaseDirectory, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

const Tiptap = () => {
  const editor = useEditor({
    extensions: [StarterKit], // define your extension array
    content: '<p>Hello World!</p>', // initial content
  })

  const providerValue = useMemo(() => ({ editor }), [editor])

  return (
    <EditorContext.Provider value={providerValue}>
      <EditorContent editor={editor} />
      <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
      <BubbleMenu editor={editor}>This is the bubble menu</BubbleMenu>
    </EditorContext.Provider>
  )
}

export default Tiptap
