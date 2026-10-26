use serde::Serialize;

use crate::screenplay::Block;

pub const PAGE_WIDTH: f32 = 215.9;
pub const PAGE_HEIGHT: f32 = 279.4;
pub const TOP_MARGIN: f32 = 25.4;
pub const BOTTOM_MARGIN: f32 = 25.4;
pub const LINE_HEIGHT: f32 = 4.2333;

const LEFT_MARGIN: f32 = 38.1;
const CONTENT_WIDTH: f32 = 139.7;
const CONTENT_RIGHT: f32 = LEFT_MARGIN + CONTENT_WIDTH;
const CHARACTER_X: f32 = 101.6;
const DIALOGUE_X: f32 = 63.5;
const PARENTHETICAL_X: f32 = 78.74;
const CHARACTER_WIDTH: f32 = 25.4;
const DIALOGUE_WIDTH: f32 = 76.2;
const PARENTHETICAL_WIDTH: f32 = 73.66;
const CHARACTER_CELL_WIDTH: f32 = 2.54;

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum FontStyle {
    Regular,
    Bold,
    Italic,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageLayout {
    pub number: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockPlacement {
    pub index: usize,
    pub page: usize,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub line_count: usize,
    pub font_style: FontStyle,
    pub uppercase: bool,
    pub right_align: bool,
}

#[derive(Debug)]
pub struct LinePlacement {
    pub block_index: usize,
    pub page: usize,
    pub x: f32,
    pub y: f32,
    pub text: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenplayLayout {
    pub pages: Vec<PageLayout>,
    pub blocks: Vec<BlockPlacement>,
    #[serde(skip_serializing)]
    pub lines: Vec<LinePlacement>,
}

#[derive(Clone, Copy)]
struct BlockStyle {
    x: f32,
    width: f32,
    max_chars: usize,
    font_style: FontStyle,
    uppercase: bool,
    right_align: bool,
}

fn block_style(block: &Block) -> BlockStyle {
    match block {
        Block::Scene { .. } => BlockStyle {
            x: LEFT_MARGIN,
            width: CONTENT_WIDTH,
            max_chars: 55,
            font_style: FontStyle::Bold,
            uppercase: true,
            right_align: false,
        },
        Block::Action { .. } => BlockStyle {
            x: LEFT_MARGIN,
            width: CONTENT_WIDTH,
            max_chars: 55,
            font_style: FontStyle::Regular,
            uppercase: false,
            right_align: false,
        },
        Block::Character { .. } => BlockStyle {
            x: CHARACTER_X,
            width: CHARACTER_WIDTH,
            max_chars: 10,
            font_style: FontStyle::Regular,
            uppercase: true,
            right_align: false,
        },
        Block::Dialogue { .. } => BlockStyle {
            x: DIALOGUE_X,
            width: DIALOGUE_WIDTH,
            max_chars: 30,
            font_style: FontStyle::Regular,
            uppercase: false,
            right_align: false,
        },
        Block::Parenthetical { .. } => BlockStyle {
            x: PARENTHETICAL_X,
            width: PARENTHETICAL_WIDTH,
            max_chars: 29,
            font_style: FontStyle::Italic,
            uppercase: false,
            right_align: false,
        },
        Block::Transition { .. } => BlockStyle {
            x: LEFT_MARGIN,
            width: CONTENT_WIDTH,
            max_chars: 55,
            font_style: FontStyle::Regular,
            uppercase: true,
            right_align: true,
        },
    }
}

fn block_text(block: &Block) -> &str {
    match block {
        Block::Scene { text }
        | Block::Action { text }
        | Block::Character { text }
        | Block::Dialogue { text }
        | Block::Parenthetical { text }
        | Block::Transition { text } => text,
    }
}

fn wrap_text(text: &str, max_chars: usize) -> Vec<String> {
    let mut lines = Vec::new();
    let mut line = String::new();

    for word in text.split_whitespace() {
        let characters: Vec<char> = word.chars().collect();

        if characters.len() > max_chars {
            if !line.is_empty() {
                lines.push(std::mem::take(&mut line));
            }

            let mut chunks = characters.chunks_exact(max_chars);
            lines.extend(chunks.by_ref().map(|chunk| chunk.iter().collect()));
            line.extend(chunks.remainder());
        } else if line.is_empty() {
            line.push_str(word);
        } else if line.chars().count() + 1 + characters.len() <= max_chars {
            line.push(' ');
            line.push_str(word);
        } else {
            lines.push(std::mem::take(&mut line));
            line.push_str(word);
        }
    }

    if !line.is_empty() {
        lines.push(line);
    }

    if lines.is_empty() {
        lines.push(String::new());
    }

    lines
}

pub fn layout(blocks: &[Block]) -> ScreenplayLayout {
    let mut pages = vec![PageLayout { number: 1 }];
    let mut block_placements = Vec::new();
    let mut line_placements = Vec::new();
    let mut page = 0;
    let mut y = PAGE_HEIGHT - TOP_MARGIN;
    let mut page_has_content = false;

    for (index, block) in blocks.iter().enumerate() {
        let style = block_style(block);
        let text = block_text(block);
        let text = if style.uppercase {
            text.to_uppercase()
        } else {
            text.to_owned()
        };
        let lines = wrap_text(&text, style.max_chars);

        if page_has_content && y - LINE_HEIGHT * (lines.len() as f32) < BOTTOM_MARGIN {
            page += 1;
            pages.push(PageLayout { number: page + 1 });
            y = PAGE_HEIGHT - TOP_MARGIN;
            page_has_content = false;
        }

        block_placements.push(BlockPlacement {
            index,
            page,
            x: style.x,
            y,
            width: style.width,
            line_count: lines.len(),
            font_style: style.font_style,
            uppercase: style.uppercase,
            right_align: style.right_align,
        });

        for line in lines {
            if page_has_content && y - LINE_HEIGHT < BOTTOM_MARGIN {
                page += 1;
                pages.push(PageLayout { number: page + 1 });
                y = PAGE_HEIGHT - TOP_MARGIN;
            }

            let x = if style.right_align {
                CONTENT_RIGHT - line.chars().count() as f32 * CHARACTER_CELL_WIDTH
            } else {
                style.x
            };
            line_placements.push(LinePlacement {
                block_index: index,
                page,
                x,
                y,
                text: line,
            });
            page_has_content = true;
            y -= LINE_HEIGHT;
        }
    }

    ScreenplayLayout {
        pages,
        blocks: block_placements,
        lines: line_placements,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wraps_words_at_the_configured_width() {
        assert_eq!(wrap_text("one two three", 7), ["one two", "three"]);
    }

    #[test]
    fn splits_unbroken_words_without_losing_the_remainder() {
        assert_eq!(wrap_text("abcdefghijk lm", 5), ["abcde", "fghij", "k lm"]);
    }

    #[test]
    fn transition_x_ends_at_the_content_margin() {
        let layout = layout(&[Block::Transition {
            text: "CUT TO:".into(),
        }]);
        assert!((layout.lines[0].x - 160.02).abs() < 0.001);
    }

    #[test]
    fn moves_a_block_that_does_not_fit_to_the_next_page() {
        let blocks = (0..55)
            .map(|_| Block::Action {
                text: "line".into(),
            })
            .collect::<Vec<_>>();
        let layout = layout(&blocks);

        assert_eq!(layout.pages.len(), 2);
        assert_eq!(layout.blocks[54].page, 1);
    }
}
