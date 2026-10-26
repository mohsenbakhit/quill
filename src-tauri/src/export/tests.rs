use super::*;
use serde_json::json;

fn block(kind: &str, text: &str) -> Value {
    if text.is_empty() {
        json!({"type": kind})
    } else {
        json!({"type": kind, "content": [{"type": "text", "text": text}]})
    }
}

fn doc(blocks: Vec<Value>) -> Value {
    json!({"type": "doc", "content": blocks})
}

fn sample() -> Value {
    doc(vec![
        block("sceneHeading", "int. coffee shop - day"),
        block("action", "Rain beads against the window. A bell rings."),
        block("character", "Mara"),
        block("parenthetical", "quietly"),
        block("dialogue", "One more page. Then we go."),
        block("transition", "cut to:"),
        block("sceneHeading", "ext. street - day"),
    ])
}

#[test]
fn validates_document_root_and_content() {
    for invalid in [
        Value::Null,
        json!({}),
        json!({"type": "doc"}),
        doc(vec![]),
        json!({"type":"action", "content": [block("action", "hello")]}),
        json!({"type":"doc", "content":"hello"}),
    ] {
        assert!(fountain(&invalid).is_err(), "{invalid}");
        assert!(pdf(&invalid).is_err(), "{invalid}");
    }
}

#[test]
fn rejects_unsupported_blocks_instead_of_dropping_them() {
    for kind in ["paragraph", "heading", "image", "doc", "text"] {
        assert!(parse(&doc(vec![block(kind, "retained text")])).is_err());
    }
}

#[test]
fn rejects_marks_attrs_and_unknown_fields() {
    for invalid in [
        json!({"type":"doc", "extra":true, "content":[block("action", "x")]}),
        doc(vec![json!({"type":"action", "attrs":{"align":"left"}})]),
        doc(vec![
            json!({"type":"action", "content":[{"type":"text", "text":"hello", "marks":[{"type":"bold"}]}]}),
        ]),
    ] {
        assert!(parse(&invalid).is_err());
    }
}

#[test]
fn rejects_invalid_inline_content() {
    for leaf in [
        json!({"type":"text"}),
        json!({"type":"text", "text":""}),
        json!({"type":"text", "text":12}),
        json!({"type":"hardBreak"}),
        json!({"type":"action", "text":"hello"}),
    ] {
        assert!(parse(&doc(vec![json!({"type":"action", "content":[leaf]})])).is_err());
    }
}

#[test]
fn allows_empty_blocks_and_concatenates_text_leaves() {
    let parsed = parse(&doc(vec![json!({"type":"sceneHeading", "content":[]}),
        json!({"type":"action", "content":[{"type":"text", "text":"One "}, {"type":"text", "text":"two"}]})])).unwrap();
    assert_eq!(parsed[0].text, "");
    assert_eq!(parsed[1].text, "One two");
}

#[test]
fn normalizes_line_endings_and_accepts_tabs() {
    let parsed = parse(&doc(vec![block("action", "one\r\ntwo\rthree\tfour")])).unwrap();
    assert_eq!(parsed[0].text, "one\ntwo\nthree\tfour");
}

#[test]
fn rejects_control_characters() {
    for c in ['\0', '\x07', '\x1b', '\x7f'] {
        assert!(parse(&doc(vec![block("action", &format!("text{c}"))])).is_err());
    }
}

#[test]
fn limits_document_size_and_element_count() {
    assert!(parse(&doc(vec![block("action", &"x".repeat(MAX_TEXT_BYTES + 1))])).is_err());
    assert!(parse(&doc(vec![block("action", ""); MAX_BLOCKS + 1])).is_err());
}

#[test]
fn fountain_serializes_every_screenplay_element() {
    assert_eq!(
        fountain(&sample()).unwrap(),
        concat!(
            ".INT. COFFEE SHOP - DAY\n\n",
            "!Rain beads against the window. A bell rings.\n\n",
            "@MARA\n(quietly)\nOne more page. Then we go.\n\n",
            "CUT TO:\n\n.EXT. STREET - DAY\n"
        )
    );
}

#[test]
fn fountain_forces_ambiguous_action_and_nonstandard_headings() {
    assert_eq!(
        fountain(&doc(vec![
            block("action", "INT. NOT A SCENE\nCUT TO:\nTITLE: NO TITLE"),
            block("sceneHeading", "later"),
            block("character", "23"),
            block("dialogue", "Yes.")
        ]))
        .unwrap(),
        "!INT. NOT A SCENE\n!CUT TO:\n!TITLE: NO TITLE\n\n.LATER\n\n@23\nYes.\n"
    );
}

#[test]
fn fountain_escapes_literal_markup() {
    assert_eq!(
        fountain(&doc(vec![block(
            "action",
            "*literal* _underscore_ [note] /*keep*/ \\ #4# ^"
        )]))
        .unwrap(),
        "!\\*literal\\* \\_underscore\\_ [note] /\\*keep\\*/ \\\\ \\#4\\# ^\n"
    );
}

#[test]
fn fountain_reports_hidden_notes_instead_of_losing_text() {
    assert!(
        fountain(&doc(vec![block("action", "Visible [[not a note]]")]))
            .unwrap_err()
            .contains("hidden note")
    );
}

#[test]
fn fountain_preserves_unicode() {
    let text = "Zoë’s café — 東京";
    assert!(fountain(&doc(vec![block("action", text)]))
        .unwrap()
        .contains(text));
}

#[test]
fn fountain_keeps_dialogue_blank_lines_inside_speech() {
    assert_eq!(
        fountain(&doc(vec![
            block("character", "Mara"),
            block("dialogue", "Wait.\n\nNow.")
        ]))
        .unwrap(),
        "@MARA\nWait.\n  \nNow.\n"
    );
}

#[test]
fn fountain_protects_dialogue_that_looks_like_markup() {
    assert_eq!(
        fountain(&doc(vec![
            block("character", "Mara"),
            block("dialogue", ">Also spoken\n~Not lyrics")
        ]))
        .unwrap(),
        "@MARA\n\\>Also spoken\n\\~Not lyrics\n"
    );
    assert!(fountain(&doc(vec![
        block("character", "Mara"),
        block("dialogue", "(This is spoken.)")
    ]))
    .unwrap_err()
    .contains("looks like a parenthetical"));
}

#[test]
fn fountain_rejects_orphan_cues_and_multiline_parentheticals() {
    assert!(fountain(&doc(vec![block("character", "Mara")]))
        .unwrap_err()
        .contains("needs dialogue"));
    assert!(fountain(&doc(vec![
        block("character", "Mara"),
        block("parenthetical", "one\ntwo")
    ]))
    .unwrap_err()
    .contains("single line"));
}

#[test]
fn fountain_parentheticals_are_wrapped_once() {
    for source in ["quietly", "(quietly)", "  (quietly)  "] {
        let result = fountain(&doc(vec![
            block("character", "Mara"),
            block("parenthetical", source),
        ]))
        .unwrap();
        assert_eq!(result, "@MARA\n(quietly)\n");
    }
}

#[test]
fn fountain_reports_orphan_speech() {
    for kind in ["dialogue", "parenthetical"] {
        let error = fountain(&doc(vec![
            block("sceneHeading", "INT. ROOM"),
            block(kind, "hello"),
        ]))
        .unwrap_err();
        assert!(error.contains("Element 2 needs a Character cue"));
    }
}

#[test]
fn fountain_character_context_ends_at_action_or_scene() {
    for kind in ["action", "sceneHeading", "transition"] {
        assert!(fountain(&doc(vec![
            block("character", "Mara"),
            block(kind, "Text"),
            block("dialogue", "Hello")
        ]))
        .is_err());
    }
}

#[test]
fn fountain_rejects_multiline_cues_headings_and_transitions() {
    for kind in ["sceneHeading", "character", "transition"] {
        assert!(fountain(&doc(vec![block(kind, "first\nsecond")]))
            .unwrap_err()
            .contains("single line"));
    }
}

#[test]
fn fountain_reports_unrepresentable_heading() {
    assert!(fountain(&doc(vec![block("sceneHeading", "...later")]))
        .unwrap_err()
        .contains("letter or number"));
}

#[test]
fn empty_screenplay_exports_valid_files() {
    let empty = doc(vec![block("sceneHeading", "")]);
    assert_eq!(fountain(&empty).unwrap(), "\n");
    assert_eq!(
        lopdf::Document::load_mem(&pdf(&empty).unwrap())
            .unwrap()
            .get_pages()
            .len(),
        1
    );
}

#[test]
fn wrap_uses_word_boundaries_and_hard_wraps_long_words() {
    assert_eq!(wrap("one two three", 7), ["one two", "three"]);
    assert_eq!(wrap("abcdefghijk", 4), ["abcd", "efgh", "ijk"]);
    assert_eq!(wrap("ééééé", 3), ["ééé", "éé"]);
}

#[test]
fn wrap_retains_explicit_line_breaks_and_expands_tabs() {
    assert_eq!(wrap("one\n\ntwo\tend", 20), ["one", "", "two    end"]);
}

#[test]
fn pdf_layout_applies_screenplay_indents_and_right_alignment() {
    let pages = layout(&parse(&sample()).unwrap(), 7.2);
    let lines = &pages[0];
    assert_eq!(lines[0].x, 108.0);
    assert_eq!(lines[1].x, 108.0);
    assert_eq!(lines[2].x, 252.0);
    assert_eq!(lines[3].x, 216.0);
    assert_eq!(lines[4].x, 180.0);
    assert!((lines[5].x + 7.2 * lines[5].text.len() as f32 - 540.0).abs() < 0.01);
    assert_eq!(lines[2].y - lines[3].y, LINE_HEIGHT);
    assert_eq!(lines[3].y - lines[4].y, LINE_HEIGHT);
}

#[test]
fn pdf_layout_paginates_without_clipping_or_losing_text() {
    let text = (0..160)
        .map(|i| format!("LINE{i}"))
        .collect::<Vec<_>>()
        .join("\n");
    let pages = layout(&parse(&doc(vec![block("action", &text)])).unwrap(), 7.2);
    assert_eq!(pages.len(), 3);
    assert_eq!(pages.iter().map(Vec::len).sum::<usize>(), 160);
    assert!(pages
        .iter()
        .flatten()
        .all(|line| line.y >= 84.0 && line.y <= TOP));
    assert_eq!(pages[2].last().unwrap().text, "LINE159");
}

#[test]
fn pdf_keeps_character_parenthetical_and_dialogue_together() {
    let filler = vec!["line"; 49].join("\n");
    let pages = layout(
        &parse(&doc(vec![
            block("action", &filler),
            block("character", "Mara"),
            block("parenthetical", "quietly"),
            block("dialogue", "A\nB\nC"),
        ]))
        .unwrap(),
        7.2,
    );
    assert_eq!(pages[0].len(), 49);
    assert_eq!(pages[1][0].text, "MARA");
    assert_eq!(pages[1][1].text, "(quietly)");
    assert_eq!(pages[1][2].text, "A");
}

#[test]
fn pdf_keeps_scene_heading_with_following_action() {
    let filler = vec!["line"; 50].join("\n");
    let pages = layout(
        &parse(&doc(vec![
            block("action", &filler),
            block("sceneHeading", "EXT. ROAD"),
            block("action", "A car arrives."),
        ]))
        .unwrap(),
        7.2,
    );
    assert_eq!(pages[1][0].text, "EXT. ROAD");
    assert_eq!(pages[1][1].text, "A car arrives.");
}

#[test]
fn pdf_has_letter_pages_embedded_font_and_extractable_text() {
    let bytes = pdf(&sample()).unwrap();
    assert!(bytes.starts_with(b"%PDF-"));
    let parsed = lopdf::Document::load_mem(&bytes).unwrap();
    let page_id = *parsed.get_pages().get(&1).unwrap();
    let media = parsed
        .get_object(page_id)
        .unwrap()
        .as_dict()
        .unwrap()
        .get(b"MediaBox")
        .unwrap()
        .as_array()
        .unwrap();
    assert_eq!(
        media
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect::<Vec<_>>(),
        [0, 0, 612, 792]
    );
    let extracted = parsed.extract_text(&[1]).unwrap();
    for phrase in [
        "INT. COFFEE SHOP - DAY",
        "MARA",
        "(quietly)",
        "One more page.",
        "CUT TO:",
    ] {
        assert!(
            extracted.contains(phrase),
            "Missing {phrase:?}: {extracted}"
        );
    }
    assert!(parsed
        .objects
        .values()
        .any(|v| v.as_dict().is_ok_and(|d| d.has(b"FontFile2"))));
    assert!(parsed
        .objects
        .values()
        .any(|v| v.as_dict().is_ok_and(|d| d.has(b"ToUnicode"))));
}

#[test]
fn pdf_preserves_accented_letters_and_typographic_punctuation() {
    let text = "Zoë’s café — déjà vu… “Yes.”";
    let parsed =
        lopdf::Document::load_mem(&pdf(&doc(vec![block("action", text)])).unwrap()).unwrap();
    assert!(parsed.extract_text(&[1]).unwrap().contains(text));
}

#[test]
fn pdf_reports_missing_glyph_instead_of_corrupting_text() {
    let error = pdf(&doc(vec![block("action", "A cat 🐈")])).unwrap_err();
    assert!(error.contains("U+1F408"));
    assert!(error.contains("Fountain"));
}

#[test]
fn pdf_page_numbers_start_on_second_page_and_text_survives_pagination() {
    let text = (0..120)
        .map(|i| format!("LINE{i}"))
        .collect::<Vec<_>>()
        .join("\n");
    let parsed =
        lopdf::Document::load_mem(&pdf(&doc(vec![block("action", &text)])).unwrap()).unwrap();
    assert_eq!(parsed.get_pages().len(), 3);
    assert!(parsed.extract_text(&[1]).unwrap().starts_with("LINE0"));
    assert!(parsed.extract_text(&[2]).unwrap().starts_with("2."));
    assert!(parsed.extract_text(&[3]).unwrap().starts_with("3."));
    let all = parsed.extract_text(&[1, 2, 3]).unwrap();
    for i in 0..120 {
        assert!(all.contains(&format!("LINE{i}\n")), "Missing line {i}");
    }
}

#[test]
fn exports_are_deterministic_and_leave_source_unchanged() {
    let source = sample();
    let before = source.clone();
    assert_eq!(pdf(&source).unwrap(), pdf(&source).unwrap());
    assert_eq!(fountain(&source).unwrap(), fountain(&source).unwrap());
    assert_eq!(source, before);
}
