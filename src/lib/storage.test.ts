import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isTauri } from '@tauri-apps/api/core'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { documentNameFromPath, emptyDocument, MAX_DOCUMENT_BYTES, parseDocument, requireDesktop, safeFilename, saveDraft, validateDocument } from './storage'

vi.mock('@tauri-apps/api/core', () => ({ isTauri: vi.fn(() => true) }))
vi.mock('@tauri-apps/plugin-fs', () => ({ writeTextFile: vi.fn() }))

const valid = { type: 'doc', content: [{ type: 'sceneHeading', content: [{ type: 'text', text: 'INT. CAFÉ - DAY' }] }] }

beforeEach(() => { vi.clearAllMocks(); vi.mocked(isTauri).mockReturnValue(true) })

describe('Quill document validation', () => {
  it.each(['sceneHeading', 'action', 'character', 'dialogue', 'parenthetical', 'transition'])('accepts %s and Unicode', type => {
    const document = { type: 'doc', content: [{ type, content: [{ type: 'text', text: 'Café — 東京\nSecond line' }] }] }
    expect(parseDocument(JSON.stringify(document))).toEqual(document)
  })
  it('accepts empty blocks with either omitted or empty content', () => {
    expect(() => validateDocument({ type: 'doc', content: [{ type: 'action' }, { type: 'dialogue', content: [] }] })).not.toThrow()
  })
  it('returns a fresh empty screenplay on each call', () => {
    expect(emptyDocument()).toEqual({ type: 'doc', content: [{ type: 'sceneHeading', content: [] }] })
    expect(emptyDocument()).not.toBe(emptyDocument())
  })
  it.each([null, [], {}, { type: 'doc' }, { type: 'doc', content: [] }, { type: 'paragraph', content: [] }, { ...valid, extra: true }])('rejects malformed document %j', input => {
    expect(() => validateDocument(input)).toThrow('valid Quill screenplay')
  })
  it.each([null, { type: 'paragraph' }, { type: 'action', attrs: {} }, { type: 'action', content: {} }])('rejects unsupported block %j', block => {
    expect(() => validateDocument({ type: 'doc', content: [block] })).toThrow('unsupported screenplay element')
  })
  it.each([null, {}, { type: 'hardBreak' }, { type: 'text', text: '' }, { type: 'text', text: 42 }, { type: 'text', text: 'bold', marks: [{ type: 'bold' }] }])('rejects invalid text leaf %j', leaf => {
    expect(() => validateDocument({ type: 'doc', content: [{ type: 'action', content: [leaf] }] })).toThrow('invalid text formatting')
  })
  it('reports malformed JSON clearly', () => { expect(() => parseDocument('{broken')).toThrow('not valid JSON') })
  it('limits encoded file size rather than UTF-16 character count', () => {
    const source = JSON.stringify({ type: 'doc', content: [{ type: 'action', content: [{ type: 'text', text: 'é'.repeat(MAX_DOCUMENT_BYTES / 2) }] }] })
    expect(source.length).toBeLessThan(MAX_DOCUMENT_BYTES)
    expect(() => parseDocument(source)).toThrow('10 MB')
  })
})

describe('file helpers', () => {
  it.each([
    ['/scripts/My film.quill', 'My film'],
    ['C:\\scripts\\Night.QUILL', 'Night'],
    ['script', 'script'],
    ['', 'Untitled screenplay'],
  ])('gets a display name from %s', (path, expected) => { expect(documentNameFromPath(path)).toBe(expected) })
  it('sanitizes export filenames', () => {
    expect(safeFilename(' A/B: C? ')).toBe('A-B- C-')
    expect(safeFilename('   ')).toBe('Untitled screenplay')
  })
  it('explains desktop-only features in browser preview', () => {
    vi.mocked(isTauri).mockReturnValue(false)
    expect(requireDesktop).toThrow('desktop app')
  })
  it('writes the exact validated document to the selected path', async () => {
    await saveDraft('/scripts/Film.quill', valid)
    expect(writeTextFile).toHaveBeenCalledWith('/scripts/Film.quill', JSON.stringify(valid, null, 2))
  })
  it('does not write invalid data', async () => {
    await expect(saveDraft('/script.quill', { type: 'doc', content: [] })).rejects.toThrow()
    expect(writeTextFile).not.toHaveBeenCalled()
  })
  it('propagates filesystem failures', async () => {
    vi.mocked(writeTextFile).mockRejectedValueOnce(new Error('Disk full'))
    await expect(saveDraft('/script.quill', valid)).rejects.toThrow('Disk full')
  })
})
