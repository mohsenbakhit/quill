// extensions/index.ts
import Text from '@tiptap/extension-text'
import { Placeholder, UndoRedo } from '@tiptap/extensions'
import { ScreenplayDocument } from '../nodes/Document'
import {
  SceneHeading,
  Action,
  Character,
  Dialogue,
  Parenthetical,
  Transition,
} from '../nodes/screenplayNodes'
import { ElementTransitions } from './ElementTransitions'
import { RustLayout } from './RustLayout'

export const screenplayExtensions = [
  ScreenplayDocument,
  Text,
  SceneHeading,
  Action,
  Character,
  Dialogue,
  Parenthetical,
  Transition,
  Placeholder.configure({
    placeholder: ({ node }) => {
      switch (node.type.name) {
        case 'sceneHeading':
          return 'INT. LOCATION - DAY'
        case 'action':
          return 'Describe the action.'
        case 'character':
          return 'CHARACTER NAME'
        case 'dialogue':
          return 'Write dialogue.'
        case 'parenthetical':
          return '(direction)'
        case 'transition':
          return 'CUT TO:'
        default:
          return ''
      }
    },
  }),
  UndoRedo,
  ElementTransitions,
  RustLayout,
]
