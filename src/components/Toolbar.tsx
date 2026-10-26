import type { Editor } from '@tiptap/react'
import { FileMenu } from './FileMenu'
import { ExportMenu } from './ExportMenu'
import { ELEMENTS } from '../utils/elements'

interface ToolbarProps {
  editor: Editor | null
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
  documentName: string
  onDocumentChange: (name: string) => void
  element: string
  canUndo: boolean
  canRedo: boolean
  zoom: number
  setZoom: (zoom: number) => void
  navigatorOpen: boolean
  onToggleNavigator: () => void
}

export function Toolbar(props: ToolbarProps) {
  const { editor, element, canUndo, canRedo, zoom, setZoom, navigatorOpen, onToggleNavigator } = props
  return (
    <div className="toolbar" role="toolbar" aria-label="Document tools">
      <div className="toolbar-group">
        <FileMenu editor={editor} isDirty={props.isDirty} setIsDirty={props.setIsDirty} documentName={props.documentName} onDocumentChange={props.onDocumentChange} />
        <ExportMenu editor={editor} documentName={props.documentName} />
        <span className="toolbar-divider" />
        <button className="icon-button" aria-label="Undo" title="Undo (⌘/Ctrl Z)" disabled={!canUndo || !editor?.isEditable} onClick={() => editor?.chain().focus().undo().run()}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m7 4-4 4 4 4M3 8h8a5 5 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -1)"/></svg>
        </button>
        <button className="icon-button" aria-label="Redo" title="Redo (⌘/Ctrl Shift Z)" disabled={!canRedo || !editor?.isEditable} onClick={() => editor?.chain().focus().redo().run()}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m13 4 4 4-4 4m4-4H9a5 5 0 0 0 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -1)"/></svg>
        </button>
      </div>
      <div className="toolbar-group formatting-tools">
        <label className="element-control"><span className="control-label">Element</span>
          <select aria-label="Screenplay element" value={element} disabled={!editor?.isEditable} onChange={(event) => editor?.chain().focus().setNode(event.target.value).run()}>
            {ELEMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <span className="toolbar-divider" /><span className="font-indicator">Courier <span>12</span></span>
      </div>
      <div className="toolbar-group view-tools">
        <select aria-label="Zoom" className="zoom-control" value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>
          {[75, 90, 100, 110, 125, 150].map((value) => <option key={value} value={value}>{value}%</option>)}
        </select>
        <span className="toolbar-divider" />
        <button className={`icon-button ${navigatorOpen ? 'selected' : ''}`} aria-label="Toggle scene navigator" aria-pressed={navigatorOpen} title="Scene navigator" onClick={onToggleNavigator}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4v12M10 7h4M10 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  )
}
