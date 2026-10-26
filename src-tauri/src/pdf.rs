use std::{fs, path::Path};

use printpdf::{
    BuiltinFont, Mm, Op, PdfDocument, PdfFontHandle, PdfPage, PdfSaveOptions, Pt, TextItem,
    TextMatrix,
};

use crate::{
    layout::{self, FontStyle, ScreenplayLayout},
    screenplay::Block,
};

const FONT_SIZE: Pt = Pt(12.0);

fn new_ops() -> Vec<Op> {
    vec![Op::StartTextSection, Op::SetLineHeight { lh: FONT_SIZE }]
}

fn font(style: FontStyle) -> BuiltinFont {
    match style {
        FontStyle::Regular => BuiltinFont::Courier,
        FontStyle::Bold => BuiltinFont::CourierBold,
        FontStyle::Italic => BuiltinFont::CourierOblique,
    }
}

fn finish_page(pages: &mut Vec<PdfPage>, operations: &mut Vec<Op>) {
    operations.push(Op::EndTextSection);
    pages.push(PdfPage::new(
        Mm(layout::PAGE_WIDTH),
        Mm(layout::PAGE_HEIGHT),
        std::mem::replace(operations, new_ops()),
    ));
}

fn render(layout: &ScreenplayLayout) -> Vec<PdfPage> {
    let mut pages = Vec::new();
    let mut operations = new_ops();
    let mut current_page = 0;
    let mut page_has_content = false;

    for line in &layout.lines {
        while current_page < line.page {
            if page_has_content {
                finish_page(&mut pages, &mut operations);
            }
            current_page += 1;
            page_has_content = false;
        }

        let block = &layout.blocks[line.block_index];
        operations.push(Op::SetFont {
            font: PdfFontHandle::Builtin(font(block.font_style)),
            size: FONT_SIZE,
        });
        operations.push(Op::SetTextMatrix {
            matrix: TextMatrix::Translate(Mm(line.x).into(), Mm(line.y).into()),
        });
        operations.push(Op::ShowText {
            items: vec![TextItem::Text(line.text.clone())],
        });
        page_has_content = true;
    }

    if page_has_content {
        finish_page(&mut pages, &mut operations);
    }

    pages
}

pub fn export(blocks: Vec<Block>, output_path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let layout = layout::layout(&blocks);
    let mut document = PdfDocument::new("Quill Screenplay");
    let bytes = document
        .with_pages(render(&layout))
        .save(&PdfSaveOptions::default(), &mut Vec::new());

    fs::write(output_path, bytes)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

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
