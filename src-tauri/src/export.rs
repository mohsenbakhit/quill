//! Deterministic, filesystem-independent screenplay exporters. The frontend owns
//! the native save dialog and writes returned bytes only to the chosen path.

use std::collections::BTreeMap;
use std::fmt::Write;

use pdf_writer::types::{CidFontType, FontFlags, SystemInfo};
use pdf_writer::{Content, Finish, Name, Pdf, Rect, Ref, Str};
use serde::Deserialize;
use serde_json::Value;
use ttf_parser::Face;

const FONT: &[u8] = include_bytes!("../../public/fonts/CourierPrime-Regular.ttf");
const MAX_TEXT_BYTES: usize = 10 * 1024 * 1024;
const MAX_BLOCKS: usize = 100_000;
const PAGE_WIDTH: f32 = 612.0;
const PAGE_HEIGHT: f32 = 792.0;
const FONT_SIZE: f32 = 12.0;
const LINE_HEIGHT: f32 = 12.0;
const TOP: f32 = 720.0;
const ROWS: usize = 54;

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
enum Kind {
    SceneHeading,
    Action,
    Character,
    Dialogue,
    Parenthetical,
    Transition,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct DocumentInput {
    #[serde(rename = "type")]
    kind: String,
    content: Vec<BlockInput>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct BlockInput {
    #[serde(rename = "type")]
    kind: Kind,
    #[serde(default)]
    content: Vec<TextInput>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct TextInput {
    #[serde(rename = "type")]
    kind: String,
    text: String,
}

#[derive(Debug)]
struct Block {
    kind: Kind,
    text: String,
}

fn parse(document: &Value) -> Result<Vec<Block>, String> {
    let input: DocumentInput = serde_json::from_value(document.clone())
        .map_err(|error| format!("Invalid Quill document: {error}"))?;
    if input.kind != "doc" || input.content.is_empty() || input.content.len() > MAX_BLOCKS {
        return Err(
            "A Quill document must contain between 1 and 100,000 screenplay elements.".into(),
        );
    }
    let mut size = 0;
    input
        .content
        .into_iter()
        .enumerate()
        .map(|(index, block)| {
            let mut text = String::new();
            for leaf in block.content {
                if leaf.kind != "text" || leaf.text.is_empty() {
                    return Err(format!(
                        "Element {} contains an invalid text node.",
                        index + 1
                    ));
                }
                if leaf
                    .text
                    .chars()
                    .any(|c| c.is_control() && !matches!(c, '\n' | '\r' | '\t'))
                {
                    return Err(format!(
                        "Element {} contains unsupported control characters.",
                        index + 1
                    ));
                }
                size += leaf.text.len();
                if size > MAX_TEXT_BYTES {
                    return Err("The screenplay exceeds the 10 MB export limit.".into());
                }
                text.push_str(&leaf.text);
            }
            Ok(Block {
                kind: block.kind,
                text: text.replace("\r\n", "\n").replace('\r', "\n"),
            })
        })
        .collect()
}

fn displayed_text(block: &Block) -> String {
    match block.kind {
        Kind::SceneHeading | Kind::Character | Kind::Transition => block.text.to_uppercase(),
        Kind::Parenthetical => {
            let text = block.text.trim();
            if text.is_empty() || (text.starts_with('(') && text.ends_with(')')) {
                text.to_owned()
            } else {
                format!("({text})")
            }
        }
        _ => block.text.clone(),
    }
}

// Escape supported Fountain punctuation without introducing visible backslashes.
fn escape_fountain(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    for ch in text.chars() {
        if matches!(ch, '\\' | '*' | '_' | '#' | '<') {
            result.push('\\');
        }
        result.push(ch);
    }
    result
}

/// Export UTF-8 Fountain. Ambiguous orphan dialogue is reported rather than
/// silently exported as Action or assigned a fictional speaker.
pub fn fountain(document: &Value) -> Result<String, String> {
    let blocks = parse(document)?;
    let mut output = String::new();
    let mut previous = None;
    for (index, block) in blocks.iter().enumerate() {
        if block.text.trim().is_empty() {
            continue;
        }
        if block.text.contains("[[") {
            return Err(format!("Element {} contains '[[' which Fountain treats as a hidden note. Remove the double brackets or use PDF export.", index + 1));
        }
        let text = escape_fountain(&displayed_text(block));
        let is_speech = matches!(block.kind, Kind::Dialogue | Kind::Parenthetical);
        if is_speech
            && !matches!(
                previous,
                Some(Kind::Character | Kind::Dialogue | Kind::Parenthetical)
            )
        {
            return Err(format!(
                "Element {} needs a Character cue before it to export as Fountain dialogue.",
                index + 1
            ));
        }
        if !is_speech && !output.is_empty() {
            output.push('\n');
        }
        match block.kind {
            Kind::SceneHeading | Kind::Character | Kind::Transition => {
                if text.contains('\n') {
                    return Err(format!(
                        "Element {} must be a single line for Fountain export.",
                        index + 1
                    ));
                }
                if block.kind == Kind::Character {
                    let next = blocks[index + 1..]
                        .iter()
                        .find(|next| !next.text.trim().is_empty());
                    if !next.is_some_and(|next| {
                        matches!(next.kind, Kind::Dialogue | Kind::Parenthetical)
                    }) {
                        return Err(format!("Character cue {} needs dialogue or a parenthetical before Fountain export.", index + 1));
                    }
                    if text.contains('^') || text.trim_start().starts_with('(') {
                        return Err(format!("Character cue {} contains Fountain control punctuation. Remove the leading parenthesis or caret, or use PDF export.", index + 1));
                    }
                }
                let text = text.trim();
                if block.kind == Kind::SceneHeading
                    && !text.chars().next().is_some_and(char::is_alphanumeric)
                {
                    return Err(format!(
                        "Scene heading {} must start with a letter or number for Fountain export.",
                        index + 1
                    ));
                }
                match block.kind {
                    Kind::SceneHeading => output.push('.'),
                    Kind::Character => output.push('@'),
                    // Natural transitions need no force marker. Some Fountain
                    // readers otherwise retain it in a line ending in TO:.
                    _ if text.ends_with(" TO:")
                        || matches!(text, "FADE OUT." | "FADE TO BLACK." | "CUT TO BLACK.") => {}
                    _ => output.push('>'),
                }
                output.push_str(text);
                output.push('\n');
            }
            Kind::Action => {
                for line in text.split('\n') {
                    if !line.is_empty() {
                        output.push('!');
                    }
                    output.push_str(line);
                    output.push('\n');
                }
            }
            Kind::Parenthetical => {
                if text.contains('\n') {
                    return Err(format!(
                        "Parenthetical {} must be a single line for Fountain export.",
                        index + 1
                    ));
                }
                output.push_str(&text);
                output.push('\n');
            }
            Kind::Dialogue => {
                for line in text.split('\n') {
                    if line.trim().is_empty() {
                        // Fountain's explicit empty line inside a dialogue block.
                        output.push_str("  ");
                    } else {
                        if line.trim().starts_with('(') && line.trim().ends_with(')') {
                            return Err(format!("Dialogue element {} looks like a parenthetical. Change its element type or use PDF export.", index + 1));
                        }
                        // Prevent dialogue resembling a parenthetical or forced
                        // element from being interpreted as that element.
                        if line.starts_with(['~', '>', '@', '!', '.', '=', '#']) {
                            output.push('\\');
                        }
                        output.push_str(line);
                    }
                    output.push('\n');
                }
            }
        }
        previous = Some(block.kind);
    }
    if output.is_empty() {
        output.push('\n');
    }
    Ok(output)
}

#[derive(Debug)]
struct Line {
    text: String,
    x: f32,
    y: f32,
}

fn dimensions(kind: Kind) -> (f32, f32) {
    match kind {
        Kind::Character => (252.0, 288.0),
        Kind::Dialogue => (180.0, 252.0),
        Kind::Parenthetical => (216.0, 180.0),
        _ => (108.0, 432.0),
    }
}

fn wrap(text: &str, max_chars: usize) -> Vec<String> {
    let mut lines = Vec::new();
    for paragraph in text.replace('\t', "    ").split('\n') {
        let chars: Vec<char> = paragraph.chars().collect();
        let mut start = 0;
        while chars.len() - start > max_chars {
            let limit = start + max_chars;
            let split = (start + 1..=limit)
                .rev()
                .find(|&i| chars[i] == ' ')
                .unwrap_or(limit);
            lines.push(
                chars[start..split]
                    .iter()
                    .collect::<String>()
                    .trim_end()
                    .into(),
            );
            start = split;
            while start < chars.len() && chars[start] == ' ' {
                start += 1;
            }
        }
        lines.push(chars[start..].iter().collect());
    }
    lines
}

fn gap(kind: Kind, previous: Option<Kind>) -> usize {
    match (kind, previous) {
        (_, None) => 0,
        (
            Kind::Dialogue | Kind::Parenthetical,
            Some(Kind::Character | Kind::Dialogue | Kind::Parenthetical),
        ) => 0,
        (Kind::SceneHeading, _) => 2,
        _ => 1,
    }
}

fn layout(blocks: &[Block], advance: f32) -> Vec<Vec<Line>> {
    let wrapped: Vec<_> = blocks
        .iter()
        .map(|block| {
            let (_, width) = dimensions(block.kind);
            wrap(&displayed_text(block), (width / advance).floor() as usize)
        })
        .collect();
    let mut pages = vec![Vec::new()];
    let mut row = 0;
    let mut previous = None;
    for (index, block) in blocks.iter().enumerate() {
        let lines = &wrapped[index];
        let mut spacing = if row == 0 {
            0
        } else {
            gap(block.kind, previous)
        };
        // Keep headings with following action and cues/parentheticals with the
        // first dialogue lines. Oversized paragraphs still split across pages.
        let mut required = lines.len().min(ROWS);
        if matches!(
            block.kind,
            Kind::SceneHeading | Kind::Character | Kind::Parenthetical
        ) {
            if let Some(next) = blocks.get(index + 1) {
                required += gap(next.kind, Some(block.kind)) + wrapped[index + 1].len().min(ROWS);
                if block.kind == Kind::Character && next.kind == Kind::Parenthetical {
                    if let Some(after) = wrapped.get(index + 2) {
                        required += after.len().min(ROWS);
                    }
                }
            }
        }
        // The preceding heading/cue already reserved this block. Long speech
        // must split naturally instead of moving away from its character cue.
        let follows_leader = matches!(
            (previous, block.kind),
            (Some(Kind::SceneHeading), Kind::Action)
                | (Some(Kind::Character), Kind::Dialogue | Kind::Parenthetical)
                | (Some(Kind::Parenthetical), Kind::Dialogue)
        );
        if row > 0 && !follows_leader && row + spacing + required.min(ROWS) > ROWS {
            pages.push(Vec::new());
            row = 0;
            spacing = 0;
        }
        row += spacing;
        let (left, _) = dimensions(block.kind);
        for text in lines {
            if row >= ROWS {
                pages.push(Vec::new());
                row = 0;
            }
            let x = if block.kind == Kind::Transition {
                540.0 - text.chars().count() as f32 * advance
            } else {
                left
            };
            pages.last_mut().unwrap().push(Line {
                text: text.clone(),
                x,
                y: TOP - row as f32 * LINE_HEIGHT,
            });
            row += 1;
        }
        previous = Some(block.kind);
    }
    pages
}

/// Generate a Letter-size PDF with embedded, selectable Courier Prime text.
/// Missing font glyphs are an error, so exported text never becomes tofu boxes.
pub fn pdf(document: &Value) -> Result<Vec<u8>, String> {
    let blocks = parse(document)?;
    let face = Face::parse(FONT, 0).map_err(|_| "The bundled screenplay font is invalid.")?;
    let scale = 1000.0 / f32::from(face.units_per_em());
    let advance = f32::from(
        face.glyph_hor_advance(face.glyph_index(' ').unwrap())
            .unwrap(),
    ) * scale
        * FONT_SIZE
        / 1000.0;
    let pages = layout(&blocks, advance);
    let mut glyphs = BTreeMap::new();
    for character in pages
        .iter()
        .flatten()
        .flat_map(|line| line.text.chars())
        .chain("0123456789.".chars())
    {
        let glyph = face.glyph_index(character).ok_or_else(|| {
            format!("PDF font cannot display '{character}' (U+{:04X}). Use Fountain export to preserve this character.", u32::from(character))
        })?;
        glyphs.insert(character, glyph.0);
    }

    let mut pdf = Pdf::new();
    let catalog = Ref::new(1);
    let page_tree = Ref::new(2);
    let font = Ref::new(3);
    let cid_font = Ref::new(4);
    let descriptor = Ref::new(5);
    let font_file = Ref::new(6);
    let unicode_map = Ref::new(7);
    let cid_map = Ref::new(8);
    let info = SystemInfo {
        registry: Str(b"Adobe"),
        ordering: Str(b"Identity"),
        supplement: 0,
    };
    let font_name = Name(b"CourierPrime-Regular");
    pdf.catalog(catalog).pages(page_tree);
    pdf.type0_font(font)
        .base_font(font_name)
        .encoding_predefined(Name(b"Identity-H"))
        .descendant_font(cid_font)
        .to_unicode(unicode_map);

    // Assign independent CIDs per Unicode scalar, since several characters can
    // share a glyph (e.g. space/non-breaking space) but need distinct extraction.
    let character_ids: BTreeMap<char, u16> = glyphs
        .keys()
        .enumerate()
        .map(|(i, ch)| (*ch, (i + 1) as u16))
        .collect();
    let mut mapping = vec![0, 0];
    let mut widths = vec![0.0];
    for glyph in glyphs.values() {
        mapping.extend(glyph.to_be_bytes());
        widths.push(
            f32::from(
                face.glyph_hor_advance(ttf_parser::GlyphId(*glyph))
                    .unwrap_or(0),
            ) * scale,
        );
    }
    let mut cid = pdf.cid_font(cid_font);
    cid.subtype(CidFontType::Type2)
        .base_font(font_name)
        .system_info(info)
        .font_descriptor(descriptor)
        .cid_to_gid_map_stream(cid_map);
    cid.widths().consecutive(0, widths);
    cid.finish();
    let bounds = face.global_bounding_box();
    pdf.font_descriptor(descriptor)
        .name(font_name)
        .flags(FontFlags::FIXED_PITCH | FontFlags::SERIF | FontFlags::SYMBOLIC)
        .bbox(Rect::new(
            f32::from(bounds.x_min) * scale,
            f32::from(bounds.y_min) * scale,
            f32::from(bounds.x_max) * scale,
            f32::from(bounds.y_max) * scale,
        ))
        .italic_angle(0.0)
        .ascent(f32::from(face.ascender()) * scale)
        .descent(f32::from(face.descender()) * scale)
        .cap_height(f32::from(face.capital_height().unwrap_or(face.ascender())) * scale)
        .stem_v(80.0)
        .font_file2(font_file);
    pdf.stream(font_file, FONT)
        .pair(Name(b"Length1"), FONT.len() as i32);
    pdf.stream(unicode_map, unicode_cmap(&character_ids).as_bytes());
    pdf.stream(cid_map, &mapping);

    let page_ids: Vec<_> = (0..pages.len())
        .map(|i| Ref::new(9 + i as i32 * 2))
        .collect();
    pdf.pages(page_tree)
        .kids(page_ids.iter().copied())
        .count(pages.len() as i32);
    for (index, lines) in pages.iter().enumerate() {
        let page_id = page_ids[index];
        let stream_id = Ref::new(10 + index as i32 * 2);
        let mut page = pdf.page(page_id);
        page.parent(page_tree)
            .media_box(Rect::new(0.0, 0.0, PAGE_WIDTH, PAGE_HEIGHT))
            .contents(stream_id);
        page.resources().fonts().pair(Name(b"F1"), font);
        page.finish();
        let mut content = Content::new();
        let draw = |content: &mut Content, text: &str, x, y| {
            let encoded: Vec<u8> = text
                .chars()
                .flat_map(|ch| character_ids[&ch].to_be_bytes())
                .collect();
            content
                .begin_text()
                .set_font(Name(b"F1"), FONT_SIZE)
                .next_line(x, y)
                .show(Str(&encoded))
                .end_text();
        };
        if index > 0 {
            let number = format!("{}.", index + 1);
            draw(
                &mut content,
                &number,
                540.0 - number.len() as f32 * advance,
                756.0,
            );
        }
        for line in lines {
            draw(&mut content, &line.text, line.x, line.y);
        }
        pdf.stream(stream_id, &content.finish());
    }
    Ok(pdf.finish())
}

// A minimal Type 2 ToUnicode map works with readers and text extractors alike.
// Each CID maps to UTF-16, including surrogate pairs.
fn unicode_cmap(character_ids: &BTreeMap<char, u16>) -> String {
    let mut cmap = String::from("/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /QuillUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n");
    let entries: Vec<_> = character_ids.iter().collect();
    for chunk in entries.chunks(100) {
        writeln!(cmap, "{} beginbfchar", chunk.len()).unwrap();
        for (character, cid) in chunk {
            write!(cmap, "<{cid:04X}> <").unwrap();
            for unit in character.encode_utf16(&mut [0; 2]) {
                write!(cmap, "{unit:04X}").unwrap();
            }
            cmap.push_str(">\n");
        }
        cmap.push_str("endbfchar\n");
    }
    cmap.push_str("endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n");
    cmap
}

#[cfg(test)]
mod tests;
