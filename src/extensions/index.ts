// extensions/index.ts
import Text from '@tiptap/extension-text'
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
]
