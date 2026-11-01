import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Editor } from '@tiptap/react'
import { ExportMenu } from './ExportMenu'
import { exportDocument } from '../lib/export'
import { emptyDocument } from '../lib/storage'

vi.mock('../lib/export', () => ({ exportDocument: vi.fn() }))
const document = emptyDocument()
const editor = { getJSON: () => document } as Editor
beforeEach(() => { vi.resetAllMocks() })

describe('Export menu', () => {
  it('disables export until the editor is ready', () => {
    render(<ExportMenu editor={null} />)
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
  })
  it.each([['PDF', 'pdf'], ['Fountain', 'fountain']])('exports %s and reports completion', async (label, format) => {
    vi.mocked(exportDocument).mockResolvedValue(true)
    const user = userEvent.setup()
    render(<ExportMenu editor={editor} documentName="Night Shift" />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(screen.queryByRole('menuitem', { name: /FDX/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: `Export to ${label}` }))
    expect(exportDocument).toHaveBeenCalledWith(document, format, 'Night Shift')
    expect(await screen.findByRole('status')).toHaveTextContent(`${label} exported.`)
    await user.click(screen.getByRole('button', { name: 'Dismiss export message' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
  it('does not claim success when the save dialog is cancelled', async () => {
    vi.mocked(exportDocument).mockResolvedValue(false)
    const user = userEvent.setup()
    render(<ExportMenu editor={editor} />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    await user.click(screen.getByRole('menuitem', { name: 'Export to PDF' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled()
  })
  it('reports errors and makes retry available', async () => {
    vi.mocked(exportDocument).mockRejectedValue(new Error('Disk full'))
    const user = userEvent.setup()
    render(<ExportMenu editor={editor} />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    await user.click(screen.getByRole('menuitem', { name: 'Export to PDF' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Disk full')
    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled()
  })
  it('prevents duplicate exports while generation is pending', async () => {
    let finish!: (value: boolean) => void
    vi.mocked(exportDocument).mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const user = userEvent.setup()
    render(<ExportMenu editor={editor} />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    await user.click(screen.getByRole('menuitem', { name: 'Export to PDF' }))
    expect(screen.getByRole('button', { name: 'Exporting…' })).toBeDisabled()
    expect(exportDocument).toHaveBeenCalledTimes(1)
    await act(async () => { finish(true) })
    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled()
  })
})
