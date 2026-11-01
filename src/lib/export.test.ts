import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { exportDocument } from './export'
import { emptyDocument } from './storage'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(), isTauri: vi.fn(() => true) }))
vi.mock('@tauri-apps/plugin-dialog', () => ({ save: vi.fn() }))
vi.mock('@tauri-apps/plugin-fs', () => ({ writeFile: vi.fn(), writeTextFile: vi.fn() }))

beforeEach(() => { vi.resetAllMocks(); vi.mocked(isTauri).mockReturnValue(true) })

describe('export pipeline', () => {
  it('writes PDF bytes returned by the backend without text encoding them', async () => {
    const document = emptyDocument()
    vi.mocked(save).mockResolvedValue('/exports/Film.pdf')
    vi.mocked(invoke).mockResolvedValue([37, 80, 68, 70, 0, 128, 255])
    expect(await exportDocument(document, 'pdf', 'Film')).toBe(true)
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ defaultPath: 'Film.pdf', filters: [{ name: 'PDF screenplay', extensions: ['pdf'] }] }))
    expect(invoke).toHaveBeenCalledWith('export_pdf', { document })
    expect(writeFile).toHaveBeenCalledWith('/exports/Film.pdf', new Uint8Array([37, 80, 68, 70, 0, 128, 255]))
    expect(writeTextFile).not.toHaveBeenCalled()
  })
  it('writes Fountain Unicode and line breaks exactly', async () => {
    const document = emptyDocument()
    vi.mocked(save).mockResolvedValue('/exports/Film.fountain')
    vi.mocked(invoke).mockResolvedValue('.INT. CAFÉ - DAY\n\n@ÉLOÏSE\nBonjour.\n')
    expect(await exportDocument(document, 'fountain', 'Film')).toBe(true)
    expect(invoke).toHaveBeenCalledWith('export_fountain', { document })
    expect(writeTextFile).toHaveBeenCalledWith('/exports/Film.fountain', '.INT. CAFÉ - DAY\n\n@ÉLOÏSE\nBonjour.\n')
    expect(writeFile).not.toHaveBeenCalled()
  })
  it.each(['pdf', 'fountain'] as const)('cancels %s before generation or file writing', async format => {
    vi.mocked(save).mockResolvedValue(null)
    expect(await exportDocument(emptyDocument(), format, 'Film')).toBe(false)
    expect(invoke).not.toHaveBeenCalled()
    expect(writeFile).not.toHaveBeenCalled()
    expect(writeTextFile).not.toHaveBeenCalled()
  })
  it('sanitizes the suggested filename', async () => {
    vi.mocked(save).mockResolvedValue(null)
    await exportDocument(emptyDocument(), 'pdf', '../Film?')
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ defaultPath: '..-Film-.pdf' }))
  })
  it('propagates dialog errors', async () => {
    vi.mocked(save).mockRejectedValue(new Error('Dialog unavailable'))
    await expect(exportDocument(emptyDocument(), 'pdf', 'Film')).rejects.toThrow('Dialog unavailable')
    expect(invoke).not.toHaveBeenCalled()
  })
  it('does not write anything if PDF generation fails', async () => {
    vi.mocked(save).mockResolvedValue('/Film.pdf')
    vi.mocked(invoke).mockRejectedValue('Unsupported glyph')
    await expect(exportDocument(emptyDocument(), 'pdf', 'Film')).rejects.toBe('Unsupported glyph')
    expect(writeFile).not.toHaveBeenCalled()
  })
  it.each(['pdf', 'fountain'] as const)('propagates %s write failure', async format => {
    vi.mocked(save).mockResolvedValue(`/Film.${format}`)
    vi.mocked(invoke).mockResolvedValue(format === 'pdf' ? [37, 80] : '!Action\n')
    vi.mocked(writeFile).mockRejectedValue(new Error('Disk full'))
    vi.mocked(writeTextFile).mockRejectedValue(new Error('Disk full'))
    await expect(exportDocument(emptyDocument(), format, 'Film')).rejects.toThrow('Disk full')
  })
  it('explains desktop-only exports without invoking native APIs', async () => {
    vi.mocked(isTauri).mockReturnValue(false)
    await expect(exportDocument(emptyDocument(), 'pdf', 'Film')).rejects.toThrow('desktop app')
    expect(save).not.toHaveBeenCalled()
  })
  it('rejects an invalid document before showing a dialog', async () => {
    await expect(exportDocument({ type: 'doc', content: [] }, 'pdf', 'Film')).rejects.toThrow()
    expect(save).not.toHaveBeenCalled()
  })
})
