import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { calculatePageBreaks, PAGE_CONTENT_HEIGHT_PX } from '../utils/pagination'

export const pageBreakPluginKey = new PluginKey('pageBreak')

export const PageBreak = Extension.create({
  name: 'pageBreak',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pageBreakPluginKey,

        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, old) {
            const meta = tr.getMeta(pageBreakPluginKey)
            if (meta) return meta
            return old.map(tr.mapping, tr.doc)
          },
        },

        props: {
          decorations(state) {
            return pageBreakPluginKey.getState(state)
          },
        },

        view(editorView) {
          let lastBreakIndices: number[] = []
          let frame: number | null = null

          function recalculate() {
            if (frame !== null) cancelAnimationFrame(frame)

            frame = requestAnimationFrame(() => {
              frame = null
              const dom = editorView.dom as HTMLElement
              const breakIndices = calculatePageBreaks(dom, PAGE_CONTENT_HEIGHT_PX)

              const changed =
                breakIndices.length !== lastBreakIndices.length ||
                breakIndices.some((b, i) => b !== lastBreakIndices[i])

              if (!changed) return
              lastBreakIndices = breakIndices

              const decorations: Decoration[] = []
              let pageNumber = 2

              editorView.state.doc.forEach((node, offset, index) => {
                if (breakIndices.includes(index)) {
                  decorations.push(
                    Decoration.node(offset, offset + node.nodeSize, {
                      class: 'page-break-before',
                      'data-page-number': String(pageNumber),
                    })
                  )
                  pageNumber++
                }
              })


              const newSet = DecorationSet.create(editorView.state.doc, decorations)
              editorView.dispatch(editorView.state.tr.setMeta(pageBreakPluginKey, newSet))
            })
          }

          recalculate()

          const window = editorView.dom.ownerDocument.defaultView
          const resizeObserver = new ResizeObserver(recalculate)
          resizeObserver.observe(editorView.dom)
          window?.addEventListener('resize', recalculate)
          document.fonts?.ready.then(recalculate)

          return {
            update() {
              recalculate()
            },
            destroy() {
              if (frame !== null) cancelAnimationFrame(frame)
              resizeObserver.disconnect()
              window?.removeEventListener('resize', recalculate)
            },
          }
        },
      }),
    ]
  },
})
