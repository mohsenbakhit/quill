import { useEffect, useRef, useState } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { useEditor } from '@tiptap/react'
import { Toolbar } from './components/Toolbar'
import { ScreenplayEditor } from './ScreenplayEditor'
import { screenplayExtensions } from './extensions'
import { applyRustLayout } from './extensions/RustLayout'
import type { ScreenplayLayout } from './lib/layout'
import { formatEditorContent } from './utils/export'

import './styles/screenplay.css'
import './styles/toolbar.css'

function App() {
  const [isDirty, setIsDirty] = useState(true)
  const [layout, setLayout] = useState<ScreenplayLayout | null>(null)
  const layoutRequest = useRef(0)
  const editor = useEditor({
    extensions: screenplayExtensions,
    content: {
      type: 'doc',
      content: [
        { type: 'sceneHeading', content: [{ type: 'text*', text: 'INT. COFFEE SHOP - DAY' }] },
      ],
    },
    onUpdate: () => {
      setIsDirty(true)
    },
  })

  useEffect(() => {
    if (!editor || !isTauri()) return

    let active = true
    const refreshLayout = async () => {
      const request = ++layoutRequest.current

      try {
        const nextLayout = await invoke<ScreenplayLayout>('layout_screenplay', {
          screenplay: formatEditorContent(editor.getJSON()),
        })
        if (!active || request !== layoutRequest.current) return

        applyRustLayout(editor, nextLayout)
        setLayout(nextLayout)
      } catch (error) {
        console.error('Unable to calculate screenplay layout:', error)
      }
    }

    void refreshLayout()
    editor.on('update', refreshLayout)
    return () => {
      active = false
      editor.off('update', refreshLayout)
    }
  }, [editor])

  return (
    <div className="app">
      <header className="title-bar">
        <Toolbar editor={editor} isDirty={isDirty} setIsDirty={setIsDirty} layout={layout} />
      </header>
      <main className="editor-view">
        <div className="screenplay-editor" onClick={() => { editor?.commands.focus() }}>
          <ScreenplayEditor
            editor={editor}
            isDirty={isDirty}
            setIsDirty={setIsDirty}
            layout={layout}
          />
        </div>
      </main>
    </div>
  )
}

export default App
