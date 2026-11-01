import { Extension } from '@tiptap/core'
import { Fragment, Slice, type Schema } from '@tiptap/pm/model'
import { Plugin, TextSelection } from '@tiptap/pm/state'

const ENTER_MAP: Record<string, string> = {
  sceneHeading: 'action',
  action: 'action',
  character: 'dialogue',
  dialogue: 'action',
  parenthetical: 'dialogue',
  transition: 'sceneHeading',
}

const TAB_MAP: Record<string, string> = {
  sceneHeading: 'action',
  action: 'character',
  character: 'parenthetical',
  dialogue: 'parenthetical',
  parenthetical: 'dialogue',
  transition: 'sceneHeading',
}

const SHIFT_TAB_MAP: Record<string, string> = {
  sceneHeading: 'transition',
  action: 'sceneHeading',
  character: 'action',
  dialogue: 'character',
  parenthetical: 'dialogue',
  transition: 'dialogue',
}

function textNode(schema: Schema, text: string) {
  return text ? schema.text(text) : undefined
}

export const ElementTransitions = Extension.create({
  name: 'elementTransitions',

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { from, to, $from } = this.editor.state.selection
        const type = $from.parent.type.name
        const next = ENTER_MAP[type]
        if (!next) return false

        const start = $from.start()
        const nodeStart = $from.before()
        const nodeEnd = $from.after()
        const before = $from.parent.textContent.slice(0, from - start)
        const after = $from.parent.textContent.slice(to - start)
        const currentNodeType = this.editor.state.schema.nodes[type]
        const nextNodeType = this.editor.state.schema.nodes[next]

        if (!currentNodeType || !nextNodeType) return false

        const currentNode = currentNodeType.create(null, textNode(this.editor.state.schema, before))
        const nextNode = nextNodeType.create(null, textNode(this.editor.state.schema, after))
        const tr = this.editor.state.tr
        tr.replaceWith(nodeStart, nodeEnd, currentNode)
        tr.insert(nodeStart + currentNode.nodeSize, nextNode)
        tr.setSelection(TextSelection.create(tr.doc, nodeStart + currentNode.nodeSize + 1))
        tr.scrollIntoView()

        this.editor.view.dispatch(tr)
        return true
      },
      Tab: () => {
        const { $from } = this.editor.state.selection
        const type = $from.parent.type.name
        const next = TAB_MAP[type]
        if (next) this.editor.commands.setNode(next)
        return true // always swallow Tab so focus doesn't leave the editor
      },
      'Shift-Tab': () => {
        const { $from } = this.editor.state.selection
        const type = $from.parent.type.name
        const next = SHIFT_TAB_MAP[type]
        if (next) this.editor.commands.setNode(next)
        return true // always swallow Tab so focus doesn't leave the editor
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          clipboardTextParser: (text, $context) => {
            const blockType = $context.parent.type
            // ProseMirror falls back to its default parser on a falsy result, but the typings require a Slice.
            if (!blockType.isTextblock) return null as unknown as Slice
            const lines = text.replace(/\r\n?/g, '\n').split('\n')
            const nodes = lines.map(line => blockType.create(null, textNode(this.editor.state.schema, line)))
            return new Slice(Fragment.fromArray(nodes), 0, 0)
          },
        },
      }),
    ]
  },
})
