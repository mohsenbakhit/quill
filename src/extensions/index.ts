import Text from '@tiptap/extension-text'
import { ScreenplayDocument } from '../nodes/Document'
import {
  SceneHeading,
  Action,
  Character,
  Dialogue,
  Parenthetical,
  Transition,
} from '../nodes/ScreenplayNodes'

export const screenplayExtensions = [
  ScreenplayDocument,
  Text,
  SceneHeading,
  Action,
  Character,
  Dialogue,
  Parenthetical,
  Transition,
]
