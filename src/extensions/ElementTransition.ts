import { Extension } from "@tiptap/core";

const ENTER_MAP = {
  sceneHeading: 'action',
  action: 'action',
  character: 'dialogue',
  dialogue: 'action',
  parenthetical: 'dialogue',
  transition: 'sceneHeading',
}

const TAB_MAP = {
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
        return next ? this.editor.commands.setNode(next) : false
      },
      Tab: () => {
        const { $from } = this.editor.state.selection
        const type = $from.parent.type.name
        const next = TAB_MAP[type]
        return next ? this.editor.commands.setNode(next) : false
      },
    }
  },
})
