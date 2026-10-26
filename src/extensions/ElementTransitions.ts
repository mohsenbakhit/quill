import { Extension } from '@tiptap/core'
import { Fragment, Slice } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import { canSplit } from '@tiptap/pm/transform'

export const ENTER_MAP: Record<string, string> = {
  sceneHeading: 'action',
  action: 'action',
  character: 'dialogue',
  dialogue: 'action',
  parenthetical: 'dialogue',
  transition: 'sceneHeading',
}

export const TAB_MAP: Record<string, string> = {
  sceneHeading: 'action',
  action: 'character',
  character: 'parenthetical',
  dialogue: 'parenthetical',
  parenthetical: 'dialogue',
  transition: 'sceneHeading',
}

const REVERSE_TAB_MAP: Record<string, string> = {
  sceneHeading: 'transition',
  action: 'sceneHeading',
  character: 'action',
  dialogue: 'character',
  parenthetical: 'dialogue',
  transition: 'dialogue',
}

export const ElementTransitions = Extension.create({
  name: 'elementTransitions',

  addKeyboardShortcuts() {
    const changeElement = (map: Record<string, string>) => {
      const next = map[this.editor.state.selection.$from.parent.type.name]
      return next ? this.editor.commands.setNode(next) : false
    }

    return {
      Enter: () => {
        const { $from } = this.editor.state.selection
        const type = $from.parent.type.name
        const next = ENTER_MAP[type]
        if (!next) return false
        // Split and choose the next element in one transaction. Chaining
        // splitBlock/setNode can remap an already-mapped cursor and lose text.
        const transaction = this.editor.state.tr.deleteSelection()
        const position = transaction.selection.from
        const types = [{ type: this.editor.schema.nodes[next] }]
        if (!canSplit(transaction.doc, position, 1, types)) return false
        this.editor.view.dispatch(transaction.split(position, 1, types).scrollIntoView())
        return true
      },
      Tab: () => changeElement(TAB_MAP),
      'Shift-Tab': () => changeElement(REVERSE_TAB_MAP),
    }
  },

  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        clipboardTextParser: (text, $context) => {
          // Retain the current element when pasting plain-text paragraphs.
          const schema = $context.doc.type.schema
          const type = $context.parent.isTextblock ? $context.parent.type : schema.nodes.action
          const blocks = text.replace(/\r\n?/g, '\n').split('\n').map(line => (
            type.create(null, line ? schema.text(line) : undefined)
          ))
          return Slice.maxOpen(Fragment.fromArray(blocks))
        },
      },
    })]
  },
})
