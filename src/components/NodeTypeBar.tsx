import { useEffect, useState } from 'react'
import { Editor } from '@tiptap/react'
import { ReactNode } from 'react'

type NodeType =
  | 'sceneHeading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'

const NODE_TYPES: { type: NodeType; label: string }[] = [
  { type: 'sceneHeading', label: 'Scene Heading' },
  { type: 'action', label: 'Action' },
  { type: 'character', label: 'Character' },
  { type: 'dialogue', label: 'Dialogue' },
  { type: 'parenthetical', label: 'Parenthetical' },
  { type: 'transition', label: 'Transition' },
]

function getCurrentNodeType(editor: Editor): string {
  return editor.state.selection.$from.parent.type.name
}

export function NodeTypeBar({ editor, children }: { editor: Editor | null; children?: ReactNode }) {
  const [activeType, setActiveType] = useState<string | null>(
    editor ? getCurrentNodeType(editor) : null,
  )

  useEffect(() => {
    if (!editor) {
      setActiveType(null)
      return
    }

    const updateActiveType = () => {
      setActiveType(getCurrentNodeType(editor))
    }

    updateActiveType()
    editor.on('selectionUpdate', updateActiveType)
    editor.on('transaction', updateActiveType)

    return () => {
      editor.off('selectionUpdate', updateActiveType)
      editor.off('transaction', updateActiveType)
    }
  }, [editor])

  const selectNodeType = (type: NodeType) => {
    if (!editor) return

    editor.chain().focus().setNode(type).run()
    setActiveType(type)
  }

  return (
    <div className="node-type-bar" role="toolbar" aria-label="Screenplay element type">
      {children}
      {NODE_TYPES.map(({ type, label }) => (
        <button
          key={type}
          type="button"
          className={`node-type-button${activeType === type ? ' active' : ''}`}
          aria-label={`Set element to ${label}`}
          aria-pressed={activeType === type}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => selectNodeType(type)}
          disabled={!editor}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
