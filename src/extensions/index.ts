// extensions/index.ts
import Text from '@tiptap/extension-text'
import { UndoRedo } from '@tiptap/extensions/undo-redo'
import Placeholder from '@tiptap/extension-placeholder'
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

export const screenplayExtensions = [
  ScreenplayDocument,
  Text,
  SceneHeading,
  Action,
  Character,
  Dialogue,
  Parenthetical,
  Transition,
  ElementTransitions,
  UndoRedo,
  Placeholder.configure({
    placeholder: ({ node }) => ({
      sceneHeading: 'INT. LOCATION - DAY',
      action: 'Describe what we see…',
      character: 'CHARACTER',
      dialogue: 'What do they say?',
      parenthetical: '(a quiet aside)',
      transition: 'CUT TO:',
    }[node.type.name] ?? ''),
  }),
]
