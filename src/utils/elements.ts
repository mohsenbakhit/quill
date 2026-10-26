export const ELEMENTS = [
  { value: 'sceneHeading', label: 'Scene heading', next: 'Action' },
  { value: 'action', label: 'Action', next: 'Action' },
  { value: 'character', label: 'Character', next: 'Dialogue' },
  { value: 'dialogue', label: 'Dialogue', next: 'Action' },
  { value: 'parenthetical', label: 'Parenthetical', next: 'Dialogue' },
  { value: 'transition', label: 'Transition', next: 'Scene heading' },
]
