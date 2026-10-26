import { useEffect, useState } from 'react'
import { useEditor, useEditorState } from '@tiptap/react'
import { Toolbar } from './components/Toolbar'
import { ScreenplayEditor } from './ScreenplayEditor'
import { screenplayExtensions } from './extensions'
import { ELEMENTS } from './utils/elements'
import './App.css'
import './styles/screenplay.css'
import './styles/toolbar.css'

function App() {
  const [isDirty, setIsDirty] = useState(false)
  const [documentName, setDocumentName] = useState('Untitled screenplay')
  const [navigatorOpen, setNavigatorOpen] = useState(true)
  const [zoom, setZoom] = useState(100)
  const editor = useEditor({
    extensions: screenplayExtensions,
    content: { type: 'doc', content: [{ type: 'sceneHeading' }] },
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Screenplay',
        'aria-multiline': 'true',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ transaction }) => { if (transaction.docChanged) setIsDirty(true) },
  })
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null
      const scenes: { title: string; position: number }[] = []
      editor.state.doc.forEach((node, offset) => {
        if (node.type.name === 'sceneHeading' && node.textContent.trim()) {
          scenes.push({ title: node.textContent, position: offset + 1 })
        }
      })
      const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ').trim()
      const currentPosition = editor.state.selection.from
      return {
        element: editor.state.selection.$from.parent.type.name,
        wordCount: text ? text.split(/\s+/u).length : 0,
        scenes,
        activeScene: scenes.filter((scene) => scene.position <= currentPosition).length - 1,
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        editable: editor.isEditable,
      }
    },
  })

  useEffect(() => {
    document.title = `${isDirty ? '• ' : ''}${documentName} — Quill`
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [documentName, isDirty])

  const element = ELEMENTS.find((item) => item.value === state?.element) ?? ELEMENTS[0]

  return (
    <div className="app">
      <header className="document-header">
        <a className="wordmark" href="#screenplay" aria-label="Quill — jump to screenplay" onClick={() => editor?.commands.focus()}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19.5 3.5C11 2 5 7 6.5 14.5L19.5 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M4 21 16 7M7 17l6-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Quill
        </a>
        <div className="document-identity">
          <h1>{documentName}</h1>
          <span className="save-status" role="status"><span className={isDirty ? 'status-dot dirty' : 'status-dot'} />{isDirty ? 'Unsaved changes' : 'Ready to write'}</span>
        </div>
        <span className="document-kind">SCREENPLAY</span>
      </header>
      <Toolbar
        editor={editor} isDirty={isDirty} setIsDirty={setIsDirty}
        documentName={documentName} onDocumentChange={setDocumentName}
        element={element.value} canUndo={state?.canUndo ?? false} canRedo={state?.canRedo ?? false}
        zoom={zoom} setZoom={setZoom} navigatorOpen={navigatorOpen}
        onToggleNavigator={() => setNavigatorOpen((open) => !open)}
      />
      <div className="writing-workspace">
        {navigatorOpen && (
          <aside className="scene-navigator" aria-label="Scenes">
            <div className="navigator-heading"><h2>Scenes</h2><span>{state?.scenes.length ?? 0}</span></div>
            {state?.scenes.length ? (
              <ol className="scene-list">{state.scenes.map((scene, index) => (
                <li key={scene.position}>
                  <button className={index === state.activeScene ? 'scene-link active' : 'scene-link'}
                    aria-current={index === state.activeScene ? 'location' : undefined}
                    onClick={() => editor?.chain().focus().setTextSelection(scene.position).scrollIntoView().run()}>
                    <span className="scene-number">{String(index + 1).padStart(2, '0')}</span><span>{scene.title}</span>
                  </button>
                </li>
              ))}</ol>
            ) : <p className="navigator-empty">Your scenes will appear here as you write.</p>}
            <div className="navigator-note"><span>A little structure.</span><span>Room for your story.</span></div>
          </aside>
        )}
        <main className="document-workspace" id="screenplay" aria-label="Writing area">
          <div className="page-surround" style={{ zoom: zoom / 100 }}>
            <div className="page-ruler" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div>
            <ScreenplayEditor editor={editor} />
            <p className="paper-caption">US Letter <span>·</span> Courier 12 pt</p>
          </div>
        </main>
      </div>
      <footer className="status-bar">
        <div className="document-stats"><span>{state?.wordCount ?? 0} {(state?.wordCount ?? 0) === 1 ? 'word' : 'words'}</span><span>{state?.scenes.length ?? 0} {(state?.scenes.length ?? 0) === 1 ? 'scene' : 'scenes'}</span></div>
        <div className="keyboard-hints"><span><kbd>Tab</kbd> Change element</span><span><kbd>Enter</kbd> {element.next}</span></div>
        <span className="current-element">{element.label}</span>
      </footer>
    </div>
  )
}

export default App
