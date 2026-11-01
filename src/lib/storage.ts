import type { JSONContent } from '@tiptap/react'
import { isTauri } from '@tauri-apps/api/core'
import { writeTextFile } from '@tauri-apps/plugin-fs'

const ELEMENTS = new Set(['sceneHeading', 'action', 'character', 'dialogue', 'parenthetical', 'transition'])
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

export function emptyDocument(): JSONContent {
  return { type: 'doc', content: [{ type: 'sceneHeading', content: [] }] }
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function onlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every(key => keys.includes(key))
}

/** Validate before handing data to ProseMirror, which otherwise drops unknown nodes. */
export function validateDocument(value: unknown): asserts value is JSONContent {
  if (!object(value) || value.type !== 'doc' || !onlyKeys(value, ['type', 'content']) ||
    !Array.isArray(value.content) || value.content.length === 0) {
    throw new Error('This is not a valid Quill screenplay. Choose a .quill document.')
  }
  for (const block of value.content) {
    if (!object(block) || typeof block.type !== 'string' || !ELEMENTS.has(block.type) ||
      !onlyKeys(block, ['type', 'content']) || (block.content !== undefined && !Array.isArray(block.content))) {
      throw new Error('This document contains an unsupported screenplay element.')
    }
    for (const leaf of (block.content ?? []) as unknown[]) {
      if (!object(leaf) || leaf.type !== 'text' || typeof leaf.text !== 'string' || leaf.text.length === 0 ||
        !onlyKeys(leaf, ['type', 'text'])) {
        throw new Error('This document contains unsupported or invalid text formatting.')
      }
    }
  }
}

export function parseDocument(source: string): JSONContent {
  if (new TextEncoder().encode(source).length > MAX_DOCUMENT_BYTES) {
    throw new Error('This document is too large to open. The limit is 10 MB.')
  }
  let value: unknown
  try {
    value = JSON.parse(source)
  } catch {
    throw new Error('This file is not valid JSON. Choose a .quill document.')
  }
  validateDocument(value)
  return value
}

export function documentNameFromPath(path: string): string {
  return (path.split(/[\\/]/).pop() || 'Untitled screenplay').replace(/\.quill$/i, '')
}

export function safeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim() || 'Untitled screenplay'
}

export function requireDesktop(): void {
  if (!isTauri()) {
    throw new Error('Open Quill in the desktop app to open, save, or export files.')
  }
}

export async function saveDraft(path: string, document: JSONContent): Promise<void> {
  validateDocument(document)
  await writeTextFile(path, JSON.stringify(document, null, 2))
}
