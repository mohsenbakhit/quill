import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/react'
import { isTauri } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { screenplayExtensions } from '../extensions'
import { FileMenu } from './FileMenu'

vi.mock('@tauri-apps/api/core', () => ({ isTauri: vi.fn(() => true) }))
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }))
vi.mock('@tauri-apps/plugin-fs', () => ({ readTextFile: vi.fn(), writeTextFile: vi.fn() }))
const nativeWindow = vi.hoisted(() => ({ onCloseRequested: vi.fn(), close: vi.fn(), unlisten: vi.fn() }))
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => nativeWindow }))

const original = { type: 'doc', content: [{ type: 'sceneHeading', content: [{ type: 'text', text: 'INT. ORIGINAL - DAY' }] }] }
const incoming = { type: 'doc', content: [{ type: 'action', content: [{ type: 'text', text: 'A new story.' }] }] }
let editors: Editor[] = []

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(isTauri).mockReturnValue(true)
  nativeWindow.onCloseRequested.mockResolvedValue(nativeWindow.unlisten)
  vi.mocked(save).mockResolvedValue('/scripts/My film.quill')
  vi.mocked(open).mockResolvedValue('/scripts/Incoming.quill')
  vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(incoming))
})
afterEach(() => { editors.forEach(editor => editor.destroy()); editors = [] })

function setup(isDirty = false) {
  const editor = new Editor({ extensions: screenplayExtensions, content: original })
  editors.push(editor)
  const setIsDirty = vi.fn()
  const onDocumentChange = vi.fn()
  const user = userEvent.setup()
  render(<FileMenu editor={editor} isDirty={isDirty} setIsDirty={setIsDirty} documentName="My film" onDocumentChange={onDocumentChange} />)
  const select = async (label: string | RegExp) => {
    await user.click(screen.getByRole('button', { name: 'File' }))
    await user.click(screen.getByRole('menuitem', { name: label }))
  }
  return { editor, setIsDirty, onDocumentChange, user, select }
}

describe('File menu', () => {
  it('disables commands until the editor is ready', () => {
    render(<FileMenu editor={null} isDirty={false} setIsDirty={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'File' })).toBeDisabled()
  })
  it('saves a screenplay and tracks the selected filename', async () => {
    const { editor, select, setIsDirty, onDocumentChange } = setup(true)
    await select(/^Save (?:Ctrl|⌘)/)
    await waitFor(() => expect(writeTextFile).toHaveBeenCalledWith('/scripts/My film.quill', JSON.stringify(editor.getJSON(), null, 2)))
    expect(setIsDirty).toHaveBeenCalledWith(false)
    expect(onDocumentChange).toHaveBeenCalledWith('My film')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
  it('reuses the saved path and opens a dialog for Save as', async () => {
    const { select } = setup()
    await select(/^Save (?:Ctrl|⌘)/)
    await select(/^Save (?:Ctrl|⌘)/)
    expect(save).toHaveBeenCalledTimes(1)
    await select(/^Save as/)
    expect(save).toHaveBeenCalledTimes(2)
    expect(writeTextFile).toHaveBeenCalledTimes(3)
  })
  it('keeps unsaved status when Save is cancelled', async () => {
    vi.mocked(save).mockResolvedValue(null)
    const { select, editor, setIsDirty } = setup(true)
    await select(/^Save (?:Ctrl|⌘)/)
    expect(writeTextFile).not.toHaveBeenCalled()
    expect(setIsDirty).not.toHaveBeenCalled()
    expect(editor.getText()).toBe('INT. ORIGINAL - DAY')
  })
  it('reports write failures without clearing unsaved status', async () => {
    vi.mocked(writeTextFile).mockRejectedValue(new Error('Disk full'))
    const { select, setIsDirty, user } = setup(true)
    await select(/^Save (?:Ctrl|⌘)/)
    expect(await screen.findByRole('alert')).toHaveTextContent('Disk full')
    expect(setIsDirty).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Dismiss file message' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('does not mark edits made during saving as saved', async () => {
    let finish!: () => void
    vi.mocked(writeTextFile).mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const { select, editor, setIsDirty } = setup(true)
    await select(/^Save (?:Ctrl|⌘)/)
    act(() => { editor.commands.insertContent('NEW ') })
    await act(async () => { finish() })
    expect(setIsDirty).toHaveBeenCalledWith(true)
  })
  it('ignores repeated shortcuts while a save is pending', async () => {
    let finish!: () => void
    vi.mocked(writeTextFile).mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    setup(true)
    fireEvent.keyDown(document, { key: 's', ctrlKey: true })
    await waitFor(() => expect(writeTextFile).toHaveBeenCalledTimes(1))
    fireEvent.keyDown(document, { key: 's', ctrlKey: true })
    expect(save).toHaveBeenCalledTimes(1)
    await act(async () => { finish() })
  })
  it('creates an empty screenplay without prompting when clean', async () => {
    const { select, editor, onDocumentChange, setIsDirty } = setup()
    await select(/^New screenplay/)
    expect(editor.getJSON()).toEqual({ type: 'doc', content: [{ type: 'sceneHeading' }] })
    expect(onDocumentChange).toHaveBeenCalledWith('Untitled screenplay')
    expect(setIsDirty).toHaveBeenCalledWith(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(editor.isEditable).toBe(true)
  })
  it.each(['Cancel', 'Escape'])('preserves unsaved document on %s', async choice => {
    const { select, user, editor, setIsDirty } = setup(true)
    await select(/^New screenplay/)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Save your changes?')
    expect(editor.isEditable).toBe(false)
    if (choice === 'Escape') await user.keyboard('{Escape}')
    else await user.click(screen.getByRole('button', { name: choice }))
    expect(editor.getText()).toBe('INT. ORIGINAL - DAY')
    expect(setIsDirty).not.toHaveBeenCalled()
    expect(editor.isEditable).toBe(true)
  })
  it('discards only after an explicit choice', async () => {
    const { select, user, editor } = setup(true)
    await select(/^New screenplay/)
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(editor.getText()).toBe('')
    expect(writeTextFile).not.toHaveBeenCalled()
  })
  it('awaits a successful save before clearing the document', async () => {
    let finish!: () => void
    vi.mocked(writeTextFile).mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const { select, user, editor } = setup(true)
    await select(/^New screenplay/)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(editor.getText()).toBe('INT. ORIGINAL - DAY')
    expect(editor.isEditable).toBe(false)
    await act(async () => { finish() })
    expect(editor.getText()).toBe('')
    expect(editor.isEditable).toBe(true)
  })
  it('aborts New if the save dialog is cancelled', async () => {
    vi.mocked(save).mockResolvedValue(null)
    const { select, user, editor } = setup(true)
    await select(/^New screenplay/)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(editor.getText()).toBe('INT. ORIGINAL - DAY')
    expect(editor.isEditable).toBe(true)
  })
  it('aborts New if saving fails', async () => {
    vi.mocked(writeTextFile).mockRejectedValue('Permission denied')
    const { select, user, editor } = setup(true)
    await select(/^New screenplay/)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Permission denied')
    expect(editor.getText()).toBe('INT. ORIGINAL - DAY')
  })
  it('opens valid documents and saves back to their original path', async () => {
    const { select, editor, onDocumentChange, setIsDirty } = setup()
    await select(/^Open/)
    expect(editor.getText()).toBe('A new story.')
    expect(onDocumentChange).toHaveBeenCalledWith('Incoming')
    expect(setIsDirty).toHaveBeenCalledWith(false)
    await select(/^Save (?:Ctrl|⌘)/)
    expect(save).not.toHaveBeenCalled()
    expect(writeTextFile).toHaveBeenCalledWith('/scripts/Incoming.quill', JSON.stringify(incoming, null, 2))
  })
  it('does not replace unsaved text when Open is cancelled at confirmation', async () => {
    const { select, user, editor } = setup(true)
    await select(/^Open/)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(editor.getText()).toBe('INT. ORIGINAL - DAY')
  })
  it('does not prompt or read when the native Open dialog is cancelled', async () => {
    vi.mocked(open).mockResolvedValue(null)
    const { select, editor } = setup(true)
    await select(/^Open/)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(readTextFile).not.toHaveBeenCalled()
    expect(editor.getText()).toBe('INT. ORIGINAL - DAY')
  })
  it.each(['not json', JSON.stringify({ type: 'doc', content: [{ type: 'unknown' }] })])('preserves the current document for invalid files', async source => {
    vi.mocked(readTextFile).mockResolvedValue(source)
    const { select, editor, onDocumentChange } = setup()
    await select(/^Open/)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(editor.getText()).toBe('INT. ORIGINAL - DAY')
    expect(onDocumentChange).not.toHaveBeenCalled()
  })
  it('reports read failures and restores editing', async () => {
    vi.mocked(readTextFile).mockRejectedValue(new Error('File missing'))
    const { select, editor } = setup()
    await select(/^Open/)
    expect(await screen.findByRole('alert')).toHaveTextContent('File missing')
    expect(editor.isEditable).toBe(true)
  })
  it('resets undo history when opening another file', async () => {
    const { select, editor } = setup()
    act(() => { editor.commands.insertContent('Unrelated edit ') })
    await select(/^Open/)
    expect(editor.can().undo()).toBe(false)
  })
  it('supports Cmd/Ctrl shortcuts and Shift+Save as', async () => {
    setup()
    fireEvent.keyDown(document, { key: 's', metaKey: true, shiftKey: true })
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByRole('button', { name: 'File' })).toBeEnabled())
    fireEvent.keyDown(document, { key: 'o', ctrlKey: true })
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1))
  })
  it('shows useful desktop-only feedback in browser preview', async () => {
    vi.mocked(isTauri).mockReturnValue(false)
    const { select } = setup()
    await select(/^Save (?:Ctrl|⌘)/)
    expect(await screen.findByRole('alert')).toHaveTextContent('desktop app')
    expect(save).not.toHaveBeenCalled()
  })
  it('traps keyboard focus within the unsaved decision', async () => {
    const { select, user } = setup(true)
    await select(/^New screenplay/)
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveFocus()
    await user.keyboard('{Escape}')
  })
  it('starts new files without retaining the old save path', async () => {
    const { select } = setup()
    await select(/^Open/)
    await select(/^New screenplay/)
    await select(/^Save (?:Ctrl|⌘)/)
    expect(save).toHaveBeenCalledTimes(1)
    expect(JSON.parse(vi.mocked(writeTextFile).mock.calls[0][1])).toEqual({ type: 'doc', content: [{ type: 'sceneHeading' }] })
  })
})

describe('Native window safeguards', () => {
  function requestClose() {
    const event = { preventDefault: vi.fn() }
    act(() => nativeWindow.onCloseRequested.mock.calls[0][0](event))
    return event
  }
  it('allows closing a clean document without prompting', () => {
    setup()
    expect(requestClose().preventDefault).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it.each(['Cancel', 'Discard changes', 'Save changes'])('handles %s before closing a changed document', async choice => {
    const { user, editor } = setup(true)
    expect(requestClose().preventDefault).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog')).toHaveTextContent('closing Quill')
    await user.click(screen.getByRole('button', { name: choice }))
    expect(nativeWindow.close).toHaveBeenCalledTimes(choice === 'Cancel' ? 0 : 1)
    expect(writeTextFile).toHaveBeenCalledTimes(choice === 'Save changes' ? 1 : 0)
    expect(editor.isEditable).toBe(true)
  })
  it('aborts closing when the save dialog is cancelled', async () => {
    vi.mocked(save).mockResolvedValue(null)
    const { user } = setup(true)
    requestClose()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(nativeWindow.close).not.toHaveBeenCalled()
  })
  it('retains text and reports native close failures', async () => {
    nativeWindow.close.mockRejectedValue(new Error('Cannot close'))
    const { user, editor } = setup(true)
    requestClose()
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot close')
    expect(editor.getText()).toBe('INT. ORIGINAL - DAY')
    requestClose()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
  })
  it('preserves programmatic edits made during save-before-new', async () => {
    let finish!: () => void
    vi.mocked(writeTextFile).mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const { select, user, editor, setIsDirty } = setup(true)
    await select(/^New screenplay/)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    act(() => { editor.commands.insertContent('NEW ') })
    await act(async () => finish())
    expect(await screen.findByRole('alert')).toHaveTextContent('changed while saving')
    expect(editor.getText()).toContain('NEW ')
    expect(setIsDirty).toHaveBeenLastCalledWith(true)
  })
  it('does not let a close request interrupt a pending save', async () => {
    let finish!: () => void
    vi.mocked(writeTextFile).mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const { select } = setup()
    await select(/^Save (?:Ctrl|⌘)/)
    expect(requestClose().preventDefault).toHaveBeenCalledOnce()
    expect(nativeWindow.close).not.toHaveBeenCalled()
    await act(async () => finish())
  })
  it('reports a failure to register close protection', async () => {
    nativeWindow.onCloseRequested.mockRejectedValue(new Error('Unavailable'))
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not enable the close warning')
  })
})
