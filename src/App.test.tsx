import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import App from './App'

vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true, invoke: vi.fn() }))
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }))
vi.mock('@tauri-apps/plugin-fs', () => ({ readTextFile: vi.fn(), writeTextFile: vi.fn(), writeFile: vi.fn() }))
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => ({
  onCloseRequested: vi.fn().mockResolvedValue(() => {}), close: vi.fn(),
}) }))

const documentFixture = {
  type: 'doc', content: [
    { type: 'sceneHeading', content: [{ type: 'text', text: 'INT. ROOM - DAY' }] },
    { type: 'action', content: [{ type: 'text', text: 'Rain falls.' }] },
    { type: 'sceneHeading', content: [{ type: 'text', text: 'EXT. ROAD - NIGHT' }] },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(open).mockResolvedValue('/scripts/Night Drive.quill')
  vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(documentFixture))
  vi.mocked(writeTextFile).mockResolvedValue()
  vi.mocked(save).mockResolvedValue('/scripts/Night Drive.quill')
})

async function openScreenplay() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'File' }))
  await user.click(screen.getByRole('menuitem', { name: /^Open/ }))
  await screen.findByRole('heading', { name: 'Night Drive' })
  return user
}

describe('writing workspace', () => {
  it('starts with a clean, accessible empty screenplay and truthful statistics', () => {
    render(<App />)
    expect(screen.getByRole('textbox', { name: 'Screenplay' })).toHaveAttribute('aria-multiline', 'true')
    expect(screen.getByRole('heading', { name: 'Untitled screenplay' })).toBeInTheDocument()
    expect(screen.getByText('0 words')).toBeInTheDocument()
    expect(screen.getByText('0 scenes')).toBeInTheDocument()
    expect(screen.getByText('Ready to write')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
    expect(screen.getByLabelText('Screenplay element')).toHaveValue('sceneHeading')
  })

  it('opens a screenplay and updates filename, scene navigation, and word count', async () => {
    await openScreenplay()
    expect(screen.getByText('10 words')).toBeInTheDocument()
    expect(screen.getByText('2 scenes')).toBeInTheDocument()
    const navigator = screen.getByRole('complementary', { name: 'Scenes' })
    expect(within(navigator).getAllByRole('button')).toHaveLength(2)
    expect(document.title).toBe('Night Drive — Quill')
    expect(screen.getByText('Ready to write')).toBeInTheDocument()
  })

  it('moves the selection to a scene when the navigator is clicked', async () => {
    const user = await openScreenplay()
    const scene = within(screen.getByRole('complementary', { name: 'Scenes' })).getByRole('button', { name: /EXT\. ROAD/ })
    await user.click(scene)
    expect(scene).toHaveAttribute('aria-current', 'location')
    expect(screen.getByLabelText('Screenplay element')).toHaveValue('sceneHeading')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Screenplay' })).toHaveFocus())
  })

  it('changes element formatting and supports undo/redo from the toolbar', async () => {
    const user = await openScreenplay()
    await user.selectOptions(screen.getByLabelText('Screenplay element'), 'character')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(screen.getByText('1 scene')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Screenplay' }).querySelector('[data-type="character"]')).toHaveTextContent('INT. ROOM - DAY')
    expect(document.title).toBe('• Night Drive — Quill')
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByLabelText('Screenplay element')).toHaveValue('sceneHeading')
    expect(screen.getByText('2 scenes')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Redo' }))
    expect(screen.getByLabelText('Screenplay element')).toHaveValue('character')
  })

  it('keeps keyboard formatting and contextual status in sync', async () => {
    const user = userEvent.setup()
    render(<App />)
    const textbox = screen.getByRole('textbox', { name: 'Screenplay' })
    await user.click(textbox)
    fireEvent.keyDown(textbox, { key: 'Enter' })
    await waitFor(() => expect(screen.getByLabelText('Screenplay element')).toHaveValue('action'))
    fireEvent.keyDown(textbox, { key: 'Tab' })
    expect(screen.getByLabelText('Screenplay element')).toHaveValue('character')
    fireEvent.keyDown(textbox, { key: 'Enter' })
    expect(screen.getByLabelText('Screenplay element')).toHaveValue('dialogue')
    expect(textbox.querySelectorAll('[data-type]')).toHaveLength(3)
  })

  it('toggles the scene navigator without changing screenplay content', async () => {
    const user = await openScreenplay()
    const toggle = screen.getByRole('button', { name: 'Toggle scene navigator' })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('complementary', { name: 'Scenes' })).not.toBeInTheDocument()
    expect(screen.getByText('10 words')).toBeInTheDocument()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('complementary', { name: 'Scenes' })).toBeInTheDocument()
  })

  it('changes visual zoom without changing document status', async () => {
    const user = await openScreenplay()
    await user.selectOptions(screen.getByLabelText('Zoom'), '125')
    expect(screen.getByLabelText('Zoom')).toHaveValue('125')
    // jsdom does not compute the CSS zoom property; verify React's DOM value.
    expect((screen.getByRole('textbox', { name: 'Screenplay' }).closest('.page-surround') as HTMLElement).style.zoom).toBe('1.25')
    expect(screen.getByText('Ready to write')).toBeInTheDocument()
  })

  it('warns before leaving a changed document and clears the warning after saving', async () => {
    const user = await openScreenplay()
    expect(window.dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(true)
    await user.selectOptions(screen.getByLabelText('Screenplay element'), 'action')
    expect(window.dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(false)
    await user.click(screen.getByRole('button', { name: 'File' }))
    await user.click(screen.getByRole('menuitem', { name: /^Save (?:Ctrl|⌘)/ }))
    await waitFor(() => expect(screen.getByText('Ready to write')).toBeInTheDocument())
    expect(writeTextFile).toHaveBeenCalledTimes(1)
    expect(window.dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(true)
  })
})
