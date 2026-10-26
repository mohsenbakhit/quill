export type FontStyle = 'regular' | 'bold' | 'italic'

export interface PageLayout {
  number: number
}

export interface BlockPlacement {
  index: number
  page: number
  x: number
  y: number
  width: number
  lineCount: number
  fontStyle: FontStyle
  uppercase: boolean
  rightAlign: boolean
}

export interface ScreenplayLayout {
  pages: PageLayout[]
  blocks: BlockPlacement[]
}
