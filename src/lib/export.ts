import type { JSONContent } from '@tiptap/react'
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { requireDesktop, safeFilename, validateDocument } from './storage'

export type ExportFormat = 'pdf' | 'fountain'

export async function exportDocument(document: JSONContent, format: ExportFormat, name: string): Promise<boolean> {
  requireDesktop()
  validateDocument(document)
  const path = await save({
    title: `Export ${format === 'pdf' ? 'PDF' : 'Fountain'}`,
    defaultPath: `${safeFilename(name)}.${format}`,
    filters: [{ name: format === 'pdf' ? 'PDF screenplay' : 'Fountain screenplay', extensions: [format] }],
  })
  if (path === null) return false
  if (format === 'pdf') {
    const bytes = await invoke<number[]>('export_pdf', { document })
    await writeFile(path, new Uint8Array(bytes))
  } else {
    const text = await invoke<string>('export_fountain', { document })
    await writeTextFile(path, text)
  }
  return true
}
