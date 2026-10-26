import { Editor, type JSONContent } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'
import { screenplayExtensions } from './index'
import { screenplayFixture } from '../test/fixtures'

const editors: Editor[] = []

function createEditor(type = 'action', text = 'A quiet room.') {
  return createDocument({
    type: 'doc',
    content: [{ type, ...(text ? { content: [{ type: 'text', text }] } : {}) }],
  })
}

function createDocument(content: JSONContent | string) {
  const element = document.createElement('div')
  document.body.append(element)
  const editor = new Editor({ element, extensions: screenplayExtensions, content })
  editor.commands.setTextSelection(editor.state.doc.content.size - 1)
  editors.push(editor)
  return editor
}

function key(editor: Editor, key: string, shiftKey = false) {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
  editor.view.dom.dispatchEvent(event)
  return event
}

function blocks(editor: Editor) {
  return editor.state.doc.content.content.map(node => ({
    type: node.type.name,
    text: node.textContent,
  }))
}

afterEach(() => {
  for (const editor of editors) {
    const element = editor.options.element
    editor.destroy()
    if (element instanceof HTMLElement) element.remove()
  }
  editors.length = 0
})

describe('screenplay schema', () => {
  it('round trips all six elements through JSON and HTML', () => {
    const original = createDocument(screenplayFixture)
    expect(original.getJSON()).toEqual(screenplayFixture)
    const restored = createDocument(original.getHTML())
    expect(restored.getJSON()).toEqual(screenplayFixture)
  })

  it('escapes HTML text without treating screenplay prose as markup', () => {
    const editor = createEditor('action', '<script>alert("hello")</script> & café')
    expect(editor.getHTML()).toContain('&lt;script&gt;')
    expect(editor.view.dom.querySelector('script')).toBeNull()
    expect(createDocument(editor.getHTML()).getText()).toBe(editor.getText())
  })

  it('provides an editable empty screenplay block', () => {
    const editor = createEditor('sceneHeading', '')
    expect(editor.view.dom.querySelector('[data-placeholder]')).toHaveAttribute('data-placeholder', 'INT. LOCATION - DAY')
    expect(editor.commands.insertContent('EXT. ROAD - NIGHT')).toBe(true)
    expect(editor.getText()).toBe('EXT. ROAD - NIGHT')
  })

  it('rejects unsupported block and inline nodes at the schema boundary', () => {
    const editor = createEditor()
    expect(() => editor.schema.nodeFromJSON({ type: 'image' })).toThrow()
    expect(() => editor.schema.nodeFromJSON({ type: 'hardBreak' })).toThrow()
  })
})

describe('Enter screenplay transitions', () => {
  it.each([
    ['sceneHeading', 'action'],
    ['action', 'action'],
    ['character', 'dialogue'],
    ['dialogue', 'action'],
    ['parenthetical', 'dialogue'],
    ['transition', 'sceneHeading'],
  ])('creates %s → %s without losing the preceding text', (type, next) => {
    const editor = createEditor(type)
    expect(key(editor, 'Enter').defaultPrevented).toBe(true)
    expect(blocks(editor)).toEqual([{ type, text: 'A quiet room.' }, { type: next, text: '' }])
    expect(editor.state.selection.$from.parent.type.name).toBe(next)
  })

  it.each(['sceneHeading', 'action', 'character', 'dialogue', 'parenthetical', 'transition'])('handles an empty %s', type => {
    const editor = createEditor(type, '')
    key(editor, 'Enter')
    expect(editor.state.doc.childCount).toBe(2)
    expect(editor.getText().trim()).toBe('')
  })

  it('splits at the cursor instead of moving or duplicating the entire block', () => {
    const editor = createEditor('action', 'Hello world')
    editor.commands.setTextSelection(6)
    key(editor, 'Enter')
    expect(blocks(editor)).toEqual([{ type: 'action', text: 'Hello' }, { type: 'action', text: ' world' }])
  })

  it('replaces selected text before splitting', () => {
    const editor = createEditor('action', 'Hello cruel world')
    editor.commands.setTextSelection({ from: 6, to: 12 })
    key(editor, 'Enter')
    expect(blocks(editor)).toEqual([{ type: 'action', text: 'Hello' }, { type: 'action', text: ' world' }])
  })
})

describe('Tab element changes', () => {
  it.each([
    ['sceneHeading', 'action'],
    ['action', 'character'],
    ['character', 'parenthetical'],
    ['dialogue', 'parenthetical'],
    ['parenthetical', 'dialogue'],
    ['transition', 'sceneHeading'],
  ])('converts %s → %s while preserving text and selection', (type, next) => {
    const editor = createEditor(type)
    editor.commands.setTextSelection(5)
    expect(key(editor, 'Tab').defaultPrevented).toBe(true)
    expect(blocks(editor)).toEqual([{ type: next, text: 'A quiet room.' }])
    expect(editor.state.selection.from).toBe(5)
  })

  it.each([
    ['sceneHeading', 'transition'],
    ['action', 'sceneHeading'],
    ['character', 'action'],
    ['dialogue', 'character'],
    ['parenthetical', 'dialogue'],
    ['transition', 'dialogue'],
  ])('Shift-Tab converts %s → %s', (type, previous) => {
    const editor = createEditor(type)
    expect(key(editor, 'Tab', true).defaultPrevented).toBe(true)
    expect(blocks(editor)).toEqual([{ type: previous, text: 'A quiet room.' }])
  })

  it('writes a scene and a speech using only Tab, Enter, and text', () => {
    const editor = createEditor('sceneHeading', 'INT. STATION - NIGHT')
    key(editor, 'Enter')
    editor.commands.insertContent('A train arrives.')
    key(editor, 'Enter')
    key(editor, 'Tab')
    editor.commands.insertContent('MARA')
    key(editor, 'Enter')
    key(editor, 'Tab')
    editor.commands.insertContent('(whispering)')
    key(editor, 'Enter')
    editor.commands.insertContent('We made it.')
    expect(blocks(editor)).toEqual([
      { type: 'sceneHeading', text: 'INT. STATION - NIGHT' },
      { type: 'action', text: 'A train arrives.' },
      { type: 'character', text: 'MARA' },
      { type: 'parenthetical', text: '(whispering)' },
      { type: 'dialogue', text: 'We made it.' },
    ])
  })
})

describe('ordinary text editing', () => {
  it('pastes multiline text as the current element, including blank lines', () => {
    const editor = createEditor('action', '')
    editor.view.pasteText('First line\r\nSecond line\r\n\r\nLast line')
    expect(blocks(editor)).toEqual([
      { type: 'action', text: 'First line' },
      { type: 'action', text: 'Second line' },
      { type: 'action', text: '' },
      { type: 'action', text: 'Last line' },
    ])
  })

  it('pastes dialogue without turning it into scene headings', () => {
    const editor = createEditor('dialogue', 'Hello ')
    editor.view.pasteText('there.\nGoodbye.')
    expect(blocks(editor)).toEqual([
      { type: 'dialogue', text: 'Hello there.' },
      { type: 'dialogue', text: 'Goodbye.' },
    ])
  })

  it('joins adjacent blocks when Backspace is pressed at the start', () => {
    const editor = createDocument({ type: 'doc', content: [
      { type: 'action', content: [{ type: 'text', text: 'Hello ' }] },
      { type: 'action', content: [{ type: 'text', text: 'world' }] },
    ] })
    editor.commands.setTextSelection(9)
    key(editor, 'Backspace')
    expect(blocks(editor)).toEqual([{ type: 'action', text: 'Hello world' }])
  })

  it('undoes and redoes element changes', () => {
    const editor = createEditor('action', 'MARA')
    key(editor, 'Tab')
    expect(editor.can().undo()).toBe(true)
    expect(editor.commands.undo()).toBe(true)
    expect(blocks(editor)).toEqual([{ type: 'action', text: 'MARA' }])
    expect(editor.commands.redo()).toBe(true)
    expect(blocks(editor)).toEqual([{ type: 'character', text: 'MARA' }])
  })

  it('undoes Enter as one operation and keeps the text', () => {
    const editor = createEditor('character', 'MARA')
    key(editor, 'Enter')
    editor.commands.undo()
    expect(blocks(editor)).toEqual([{ type: 'character', text: 'MARA' }])
    editor.commands.redo()
    expect(blocks(editor)).toEqual([{ type: 'character', text: 'MARA' }, { type: 'dialogue', text: '' }])
  })
})
