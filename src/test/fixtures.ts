import type { JSONContent } from '@tiptap/react'

export const screenplayFixture: JSONContent = {
  type: 'doc',
  content: [
    { type: 'sceneHeading', content: [{ type: 'text', text: 'INT. COFFEE SHOP - DAY' }] },
    { type: 'action', content: [{ type: 'text', text: 'Rain traces the window. A bell rings.' }] },
    { type: 'character', content: [{ type: 'text', text: 'MARA' }] },
    { type: 'parenthetical', content: [{ type: 'text', text: '(quietly)' }] },
    { type: 'dialogue', content: [{ type: 'text', text: 'I thought you might be here.' }] },
    { type: 'transition', content: [{ type: 'text', text: 'CUT TO:' }] },
  ],
}
