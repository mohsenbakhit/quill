import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { ScreenplayLayout } from '../lib/layout'

const SCREEN_PAGE_HEIGHT_MM = 279.4 + 50.8
const PDF_PAGE_HEIGHT_MM = 279.4

export const rustLayoutPluginKey = new PluginKey('rustLayout')

export const RustLayout = Extension.create({
  name: 'rustLayout',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: rustLayoutPluginKey,

        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, old) {
            const layout = tr.getMeta(rustLayoutPluginKey) as DecorationSet | undefined
            return layout ?? old.map(tr.mapping, tr.doc)
          },
        },

        props: {
          decorations(state) {
            return rustLayoutPluginKey.getState(state)
          },
        },
      }),
    ]
  },
})

export function applyRustLayout(editor: Editor, layout: ScreenplayLayout) {
  const decorations: Decoration[] = []

  editor.state.doc.forEach((node, offset, index) => {
    const block = layout.blocks[index]
    if (!block) return

    const top = block.page * SCREEN_PAGE_HEIGHT_MM + (PDF_PAGE_HEIGHT_MM - block.y)
    const style = [
      'position: absolute',
      `left: ${block.x}mm`,
      `top: ${top}mm`,
      `width: ${block.width}mm`,
      'max-width: none',
      'margin: 0',
      'box-sizing: border-box',
      `font-weight: ${block.fontStyle === 'bold' ? 'bold' : 'normal'}`,
      `font-style: ${block.fontStyle === 'italic' ? 'italic' : 'normal'}`,
      `text-transform: ${block.uppercase ? 'uppercase' : 'none'}`,
      `text-align: ${block.rightAlign ? 'right' : 'left'}`,
    ].join('; ')

    decorations.push(
      Decoration.node(offset, offset + node.nodeSize, {
        class: 'rust-layout-block',
        style,
      }),
    )
  })

  editor.view.dispatch(
    editor.state.tr.setMeta(
      rustLayoutPluginKey,
      DecorationSet.create(editor.state.doc, decorations),
    ),
  )
}
