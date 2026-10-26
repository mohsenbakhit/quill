import type { Editor } from '@tiptap/react'

export interface FileMenuProps {
  editor: Editor | null
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
  documentName?: string
  onDocumentChange?: (name: string) => void
}
