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
const CHARACTER_X: Mm = Mm(93.98);
const DIALOGUE_X: Mm = Mm(63.5);
const PARENTHETICAL_X: Mm = Mm(78.74);
const TRANSITION_X: Mm = Mm(152.4);

const TOP_MARGIN: Mm = Mm(25.4); // 1 inch
const FONT_SIZE: Pt = Pt(12.0);
const LINE_HEIGHT: Mm = Mm(4.2333); // 12 points, converted to millimetres

pub fn export(blocks: Vec<Block>, output_path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let mut document = PdfDocument::new("Quill Screenplay");

    let mut operations = vec![
        Op::StartTextSection,
        Op::SetFont {
            font: PdfFontHandle::Builtin(BuiltinFont::Courier),
            size: FONT_SIZE,
        },
        Op::SetLineHeight { lh: FONT_SIZE },
    ];

    let mut y = PAGE_HEIGHT - TOP_MARGIN;

    for block in blocks {
        let (x, text) = match block {
            Block::Scene { text } => (LEFT_MARGIN, text),
            Block::Action { text } => (LEFT_MARGIN, text),
            Block::Character { text } => (CHARACTER_X, text),
            Block::Dialogue { text } => (DIALOGUE_X, text),
            Block::Parenthetical { text } => (PARENTHETICAL_X, text),
            Block::Transition { text } => (TRANSITION_X, text),
        };

        operations.push(Op::SetTextMatrix {
            matrix: TextMatrix::Translate(x.into(), y.into()),
        });
        operations.push(Op::ShowText {
            items: vec![TextItem::Text(text)],
        });

        y -= LINE_HEIGHT;
    }

    operations.push(Op::EndTextSection);

    let page = PdfPage::new(PAGE_WIDTH, PAGE_HEIGHT, operations);
    let bytes = document
        .with_pages(vec![page])
        .save(&PdfSaveOptions::default(), &mut Vec::new());

    fs::write(output_path, bytes)?;
    Ok(())
}
