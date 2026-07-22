import { Node, mergeAttributes } from '@tiptap/core'

export const SceneHeading = Node.create({
  name: 'sceneHeading',
  group: 'block',
  content: 'text*',

  parseHTML() {
    return [{ tag: 'div[data-type="scene-heading"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'scene-heading',
      class: 'screenplay-scene-heading',
    }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setNode('action'),
      Tab: () => false,
    }
  },
})

export const Action = Node.create({
  name: 'action',
  group: 'block',
  content: 'text*',

  parseHTML() {
    return [{ tag: 'div[data-type="action"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'action',
      class: 'screenplay-action',
    }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setNode('action'),
      Tab: () => this.editor.commands.setNode('character'),
    }
  },
})

export const Character = Node.create({
  name: 'character',
  group: 'block',
  content: 'text*',

  parseHTML() {
    return [{ tag: 'div[data-type="character"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'character',
      class: 'screenplay-character',
    }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setNode('dialogue'),
      Tab: () => this.editor.commands.setNode('parenthetical'),
    }
  },
})

export const Dialogue = Node.create({
  name: 'dialogue',
  group: 'block',
  content: 'text*',

  parseHTML() {
    return [{ tag: 'div[data-type="dialogue"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'dialogue',
      class: 'screenplay-dialogue',
    }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setNode('action'),
      Tab: () => this.editor.commands.setNode('parenthetical'),
    }
  },
})

export const Parenthetical = Node.create({
  name: 'parenthetical',
  group: 'block',
  content: 'text*',

  parseHTML() {
    return [{ tag: 'div[data-type="parenthetical"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'parenthetical',
      class: 'screenplay-parenthetical',
    }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setNode('dialogue'),
      Tab: () => false,
    }
  },
})

export const Transition = Node.create({
  name: 'transition',
  group: 'block',
  content: 'text*',

  parseHTML() {
    return [{ tag: 'div[data-type="transition"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'transition',
      class: 'screenplay-transition',
    }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setNode('sceneHeading'),
      Tab: () => false,
    }
  },
})
