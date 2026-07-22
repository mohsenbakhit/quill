import { writeTextFile } from '@tauri-apps/plugin-fs'
import { JSONContent } from '@tiptap/react'

export async function saveDraft(docJSON: JSONContent) {
  await writeTextFile("./", JSON.stringify(docJSON))
}
