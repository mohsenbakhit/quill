import { Extension } from '@tiptap/core'

const ENTER_MAP: Record<string, string> = {
  sceneHeading: 'action',
  action: 'action',
  character: 'dialogue',
  dialogue: 'action',
  parenthetical: 'dialogue',
  transition: 'sceneHeading',
}

const TAB_MAP: Record<string, string> = {
  action: 'character',
  character: 'parenthetical',
  dialogue: 'parenthetical',
}

export const ElementTransitions = Extension.create({
  name: 'elementTransitions',

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from } = this.editor.state.selection
        const type = $from.parent.type.name
        const next = ENTER_MAP[type]
        if (!next) return false
        console.log(type)
        return this.editor.chain().splitBlock().setNode(next).run()
      },
      Tab: () => {
        const { $from } = this.editor.state.selection
        const type = $from.parent.type.name
        const next = TAB_MAP[type]
        console.log(type)
        if (next) {
          this.editor.commands.setNode(next)
        }
        return true // always swallow Tab so focus doesn't leave the editor
      },
    }
  },
})
