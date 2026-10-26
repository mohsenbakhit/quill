import { useEffect, useRef, useState } from 'react'
import { save, open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { EditorState } from '@tiptap/pm/state'
import type { JSONContent } from '@tiptap/react'
import type { FileMenuProps } from '../utils/interfaces'
import { getErrorMessage } from '../utils/utils'
import { documentNameFromPath, emptyDocument, parseDocument, requireDesktop, safeFilename, saveDraft } from '../lib/storage'
import { DropdownMenu } from './DropdownMenu'

type UnsavedChoice = 'save' | 'discard' | 'cancel'
type FileAction = 'new' | 'open' | 'save' | 'saveAs' | 'close'

export function FileMenu({ editor, isDirty, setIsDirty, documentName = 'Untitled screenplay', onDocumentChange }: FileMenuProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unsavedAction, setUnsavedAction] = useState<string | null>(null)
  const currentPath = useRef<string | null>(null)
  const pending = useRef(false)
  const resolveChoice = useRef<((choice: UnsavedChoice) => void) | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const dirty = useRef(isDirty)
  const allowClose = useRef(false)
  const latestRun = useRef<((action: FileAction) => Promise<void>) | null>(null)
  dirty.current = isDirty

  useEffect(() => {
    if (!isTauri()) return
    let disposed = false
    let unlisten: (() => void) | undefined
    void getCurrentWindow().onCloseRequested(event => {
      if (allowClose.current || (!dirty.current && !pending.current)) return
      event.preventDefault()
      void latestRun.current?.('close')
    }).then(stop => {
      if (disposed) stop()
      else unlisten = stop
    }).catch(err => {
      if (!disposed) setError(`Could not enable the close warning: ${getErrorMessage(err)}`)
    })
    return () => { disposed = true; unlisten?.() }
  }, [])

  useEffect(() => {
    if (unsavedAction) dialog.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [unsavedAction])

  useEffect(() => () => { resolveChoice.current?.('cancel') }, [])

  function choose(choice: UnsavedChoice) {
    resolveChoice.current?.(choice)
    resolveChoice.current = null
    setUnsavedAction(null)
  }

  function replaceDocument(document: JSONContent) {
    if (!editor) return
    editor.commands.setContent(document)
    // A file boundary also starts a new undo history.
    editor.view.updateState(EditorState.create({
      schema: editor.schema, doc: editor.state.doc, plugins: editor.state.plugins,
    }))
  }

  function setEditable(value: boolean) {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(value, false)
    editor.view.dispatch(editor.state.tr)
  }

  async function saveCurrent(saveAs = false, requireUnchanged = false): Promise<boolean> {
    if (!editor) return false
    requireDesktop()
    const path = !saveAs && currentPath.current ? currentPath.current : await save({
      title: 'Save screenplay',
      defaultPath: currentPath.current ?? `${safeFilename(documentName)}.quill`,
      filters: [{ name: 'Quill screenplay', extensions: ['quill'] }],
    })
    if (path === null) return false
    const snapshot = editor.getJSON()
    await saveDraft(path, snapshot)
    currentPath.current = path
    onDocumentChange?.(documentNameFromPath(path))
    // Typing can continue during a normal save; never mark newer text as saved.
    const changed = JSON.stringify(editor.getJSON()) !== JSON.stringify(snapshot)
    setIsDirty(changed)
    if (changed && requireUnchanged) {
      throw new Error('The screenplay changed while saving. Your latest changes are still open; save again before continuing.')
    }
    return true
  }

  async function canReplace(action: string): Promise<boolean> {
    if (!dirty.current) return true
    const choice = await new Promise<UnsavedChoice>(resolve => {
      resolveChoice.current = resolve
      setUnsavedAction(action)
    })
    return choice === 'discard' || (choice === 'save' && await saveCurrent(false, true))
  }

  async function run(action: FileAction) {
    if (!editor || pending.current) return
    pending.current = true
    setBusy(true)
    setError(null)
    const replacing = action === 'new' || action === 'open' || action === 'close'
    const wasEditable = editor.isEditable
    if (replacing) setEditable(false)
    try {
      if (action === 'save' || action === 'saveAs') {
        await saveCurrent(action === 'saveAs')
      } else if (action === 'close') {
        if (!await canReplace('closing Quill')) return
        allowClose.current = true
        try {
          await getCurrentWindow().close()
        } catch (err) {
          allowClose.current = false
          throw err
        }
      } else if (action === 'new') {
        if (!await canReplace('creating a new screenplay')) return
        replaceDocument(emptyDocument())
        currentPath.current = null
        onDocumentChange?.('Untitled screenplay')
        setIsDirty(false)
      } else {
        requireDesktop()
        const path = await open({
          title: 'Open screenplay', multiple: false, directory: false,
          filters: [{ name: 'Quill screenplay', extensions: ['quill'] }],
        })
        if (path === null) return
        if (typeof path !== 'string') throw new Error('Choose one screenplay to open.')
        const document = parseDocument(await readTextFile(path))
        if (!await canReplace('opening another screenplay')) return
        replaceDocument(document)
        currentPath.current = path
        onDocumentChange?.(documentNameFromPath(path))
        setIsDirty(false)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      if (replacing) setEditable(wasEditable)
      pending.current = false
      setBusy(false)
      if (replacing) queueMicrotask(() => container.current?.querySelector<HTMLButtonElement>('.menu-trigger')?.focus())
    }
  }
  latestRun.current = run

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      const key = event.key.toLowerCase()
      if (!['s', 'o', 'n'].includes(key)) return
      event.preventDefault()
      void run(key === 's' ? (event.shiftKey ? 'saveAs' : 'save') : key === 'o' ? 'open' : 'new')
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  })

  const modifier = navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl+'

  return <div className="menu-group" ref={container}>
    <DropdownMenu label={busy ? 'Working…' : 'File'} disabled={!editor || busy} items={[
      { label: 'New screenplay', shortcut: `${modifier}N`, onSelect: () => { void run('new') } },
      { label: 'Open…', shortcut: `${modifier}O`, onSelect: () => { void run('open') } },
      { label: 'Save', shortcut: `${modifier}S`, onSelect: () => { void run('save') } },
      { label: 'Save as…', shortcut: `${modifier}⇧S`, onSelect: () => { void run('saveAs') } },
    ]} />
    {error && <div className="menu-feedback is-error" role="alert">
      <span>{error}</span><button type="button" aria-label="Dismiss file message" onClick={() => setError(null)}>×</button>
    </div>}
    {unsavedAction && <div className="dialog-backdrop">
      <div ref={dialog} className="document-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-title"
        aria-describedby="unsaved-description" onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); choose('cancel') }
          if (event.key === 'Tab') {
            const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
            if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[buttons.length - 1]?.focus() }
            else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) { event.preventDefault(); buttons[0]?.focus() }
          }
        }}>
        <h2 id="unsaved-title">Save your changes?</h2>
        <p id="unsaved-description">Save “{documentName}” before {unsavedAction}.</p>
        <div className="dialog-actions">
          <button type="button" className="primary-button" onClick={() => choose('save')}>Save changes</button>
          <button type="button" onClick={() => choose('discard')}>Discard changes</button>
          <button type="button" onClick={() => choose('cancel')}>Cancel</button>
        </div>
      </div>
    </div>}
  </div>
}
