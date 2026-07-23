import { Editor } from '@tiptap/react'

export interface FileMenuProps {
  editor: Editor | null
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
}
