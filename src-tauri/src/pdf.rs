use std::{fs, path::Path};

use printpdf::{
    BuiltinFont, Mm, Op, PdfDocument, PdfFontHandle, PdfPage, PdfSaveOptions, Pt, TextItem,
    TextMatrix,
};

use crate::screenplay::Block;

// US Letter: 8.5 x 11 inches.
const PAGE_WIDTH: Mm = Mm(215.9);
const PAGE_HEIGHT: Mm = Mm(279.4);

const LEFT_MARGIN: Mm = Mm(38.1); // 1.5 inches
const CONTENT_RIGHT: Mm = Mm(177.8); // 7 inches from the page edge.
const PAGE_WIDTH_CHARS: usize = 55; // 5.5in at 12pt Courier (10 characters per inch).
const CHARACTER_MAX_CHARS: usize = 10;
const DIALOGUE_MAX_CHARS: usize = 30;
const PARENTHETICAL_MAX_CHARS: usize = 29;
const CHARACTER_X: Mm = Mm(101.6); // 1.5in page margin + 2.5in editor offset.
const DIALOGUE_X: Mm = Mm(63.5);
const PARENTHETICAL_X: Mm = Mm(78.74);

const TOP_MARGIN: Mm = Mm(25.4); // 1 inch
const BOTTOM_MARGIN: Mm = Mm(25.4);
const FONT_SIZE: Pt = Pt(12.0);
const LINE_HEIGHT: Mm = Mm(4.2333); // 12 points, converted to millimetres
const CHARACTER_WIDTH: Mm = Mm(2.54); // 12pt Courier glyphs are 0.1in wide.

fn new_ops() -> Vec<Op> {
    vec![Op::StartTextSection, Op::SetLineHeight { lh: FONT_SIZE }]
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

struct BlockLayout {
    font: BuiltinFont,
    x: Mm,
    max_chars: usize,
    uppercase: bool,
    right_align: bool,
}

fn block_layout(block: &Block) -> BlockLayout {
    match block {
        Block::Scene { .. } => BlockLayout {
            font: BuiltinFont::CourierBold,
            x: LEFT_MARGIN,
            max_chars: PAGE_WIDTH_CHARS,
            uppercase: true,
            right_align: false,
        },
        Block::Action { .. } => BlockLayout {
            font: BuiltinFont::Courier,
            x: LEFT_MARGIN,
            max_chars: PAGE_WIDTH_CHARS,
            uppercase: false,
            right_align: false,
        },
        Block::Character { .. } => BlockLayout {
            font: BuiltinFont::Courier,
            x: CHARACTER_X,
            max_chars: CHARACTER_MAX_CHARS,
            uppercase: true,
            right_align: false,
        },
        Block::Dialogue { .. } => BlockLayout {
            font: BuiltinFont::Courier,
            x: DIALOGUE_X,
            max_chars: DIALOGUE_MAX_CHARS,
            uppercase: false,
            right_align: false,
        },
        Block::Parenthetical { .. } => BlockLayout {
            font: BuiltinFont::CourierOblique,
            x: PARENTHETICAL_X,
            max_chars: PARENTHETICAL_MAX_CHARS,
            uppercase: false,
            right_align: false,
        },
        Block::Transition { .. } => BlockLayout {
            font: BuiltinFont::Courier,
            x: LEFT_MARGIN,
            max_chars: PAGE_WIDTH_CHARS,
            uppercase: true,
            right_align: true,
        },
    }
}

fn block_text(block: Block) -> String {
    match block {
        Block::Scene { text }
        | Block::Action { text }
        | Block::Character { text }
        | Block::Dialogue { text }
        | Block::Parenthetical { text }
        | Block::Transition { text } => text,
    }
}

fn right_aligned_x(line: &str) -> Mm {
    Mm(CONTENT_RIGHT.0 - line.chars().count() as f32 * CHARACTER_WIDTH.0)
}

fn finish_page(pages: &mut Vec<PdfPage>, operations: &mut Vec<Op>) {
    operations.push(Op::EndTextSection);
    pages.push(PdfPage::new(
        PAGE_WIDTH,
        PAGE_HEIGHT,
        std::mem::replace(operations, new_ops()),
    ));
}

pub fn export(blocks: Vec<Block>, output_path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let mut document = PdfDocument::new("Quill Screenplay");
    let mut pages: Vec<PdfPage> = Vec::new();

    let mut operations = new_ops();
    let mut y = PAGE_HEIGHT - TOP_MARGIN;
    let mut page_has_content = false;

    for block in blocks {
        let layout = block_layout(&block);
        let text = block_text(block);
        let text = if layout.uppercase {
            text.to_uppercase()
        } else {
            text
        };
        let lines = wrap_text(&text, layout.max_chars);

        // Browser pagination inserts a break before a whole editor block when it no
        // longer fits in the 9-inch content area. Match that before emitting its lines.
        if page_has_content && y - LINE_HEIGHT * (lines.len() as f32) < BOTTOM_MARGIN {
            finish_page(&mut pages, &mut operations);
            y = PAGE_HEIGHT - TOP_MARGIN;
            page_has_content = false;
        }

        for line in lines {
            if page_has_content && y - LINE_HEIGHT <= BOTTOM_MARGIN {
                finish_page(&mut pages, &mut operations);
                y = PAGE_HEIGHT - TOP_MARGIN;
            }

            let x = if layout.right_align {
                right_aligned_x(&line)
            } else {
                layout.x
            };
            operations.push(Op::SetFont {
                font: PdfFontHandle::Builtin(layout.font),
                size: FONT_SIZE,
            });
            operations.push(Op::SetTextMatrix {
                matrix: TextMatrix::Translate(x.into(), y.into()),
            });
            operations.push(Op::ShowText {
                items: vec![TextItem::Text(line)],
            });
            page_has_content = true;
            y -= LINE_HEIGHT;
        }
    }

    if page_has_content {
        finish_page(&mut pages, &mut operations);
    }
    let bytes = document
        .with_pages(pages)
        .save(&PdfSaveOptions::default(), &mut Vec::new());

    fs::write(output_path, bytes)?;
    Ok(())
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
        assert_eq!(right_aligned_x("CUT TO:"), Mm(160.02));
    }

    #[test]
    fn writes_a_pdf() {
        let output_path =
            std::env::temp_dir().join(format!("quill-pdf-test-{}.pdf", std::process::id()));

        export(
            vec![
                Block::Scene {
                    text: "int. test room - day".into(),
                },
                Block::Dialogue {
                    text: "This dialogue is long enough to confirm that the PDF renderer wraps it."
                        .into(),
                },
            ],
            &output_path,
        )
        .expect("PDF export should succeed");

        let bytes = fs::read(&output_path).expect("PDF should be written");
        assert!(bytes.starts_with(b"%PDF"));
        fs::remove_file(output_path).expect("test PDF should be removed");
    }
}
