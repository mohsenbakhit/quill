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
const ACTION_MAX_CHARS: usize = 55; // Courier 12pt, between 1.5in margins.
const CHARACTER_X: Mm = Mm(93.98);
const DIALOGUE_X: Mm = Mm(63.5);
const PARENTHETICAL_X: Mm = Mm(78.74);
const TRANSITION_X: Mm = Mm(152.4);

const TOP_MARGIN: Mm = Mm(25.4); // 1 inch
const BOTTOM_MARGIN: Mm = Mm(25.4);
const FONT_SIZE: Pt = Pt(12.0);
const LINE_HEIGHT: Mm = Mm(4.2333); // 12 points, converted to millimetres

fn new_ops() -> Vec<Op> {
    vec![
        Op::StartTextSection,
        Op::SetFont {
            font: PdfFontHandle::Builtin(BuiltinFont::Courier),
            size: FONT_SIZE,
        },
        Op::SetLineHeight { lh: FONT_SIZE },
    ]
}

fn wrap_action_text(text: &str) -> Vec<String> {
    let mut lines = Vec::new();

    for paragraph in text.split('\n') {
        let mut line = String::new();

        for word in paragraph.split_whitespace() {
            let word_length = word.chars().count();

            if word_length > ACTION_MAX_CHARS {
                if !line.is_empty() {
                    lines.push(std::mem::take(&mut line));
                }

                let characters: Vec<char> = word.chars().collect();
                for chunk in characters.chunks(ACTION_MAX_CHARS) {
                    lines.push(chunk.iter().collect());
                }
            } else if line.is_empty() {
                line.push_str(word);
            } else if line.chars().count() + 1 + word_length <= ACTION_MAX_CHARS {
                line.push(' ');
                line.push_str(word);
            } else {
                lines.push(std::mem::take(&mut line));
                line.push_str(word);
            }
        }

        if !line.is_empty() {
            lines.push(line);
        } else if paragraph.is_empty() {
            lines.push(String::new());
        }
    }

    if lines.is_empty() {
        lines.push(String::new());
    }

    lines
}

pub fn export(blocks: Vec<Block>, output_path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let mut document = PdfDocument::new("Quill Screenplay");
    let mut pages: Vec<PdfPage> = Vec::new();

    let mut operations = new_ops();
    let mut y = PAGE_HEIGHT - TOP_MARGIN;
    let mut page_has_content = false;

    for block in blocks {
        let (x, lines) = match block {
            Block::Scene { text } => (LEFT_MARGIN, vec![text.to_uppercase()]),
            Block::Action { text } => (LEFT_MARGIN, wrap_action_text(&text)),
            Block::Character { text } => (CHARACTER_X, vec![text]),
            Block::Dialogue { text } => (DIALOGUE_X, vec![text]),
            Block::Parenthetical { text } => (PARENTHETICAL_X, vec![text]),
            Block::Transition { text } => (TRANSITION_X, vec![text]),
        };

        for line in lines {
            if page_has_content && y - LINE_HEIGHT <= BOTTOM_MARGIN {
                operations.push(Op::EndTextSection);
                pages.push(PdfPage::new(PAGE_WIDTH, PAGE_HEIGHT, operations));

                operations = new_ops();
                y = PAGE_HEIGHT - TOP_MARGIN;
            }

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
        operations.push(Op::EndTextSection);
        pages.push(PdfPage::new(PAGE_WIDTH, PAGE_HEIGHT, operations));
    }
    let bytes = document
        .with_pages(pages)
        .save(&PdfSaveOptions::default(), &mut Vec::new());

    fs::write(output_path, bytes)?;
    Ok(())
}
