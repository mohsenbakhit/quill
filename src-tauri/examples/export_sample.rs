//! Generate real export fixtures for visual QA:
//! cargo run --manifest-path src-tauri/Cargo.toml --example export_sample -- /tmp/quill-exports
use serde_json::json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let output = std::env::args()
        .nth(1)
        .ok_or("Provide an output directory")?;
    let block =
        |kind: &str, text: &str| json!({"type":kind,"content":[{"type":"text","text":text}]});
    let mut content = vec![
        block("sceneHeading", "INT. COFFEE SHOP - MORNING"),
        block("action", "Rain threads down the window. MARA sits alone, surrounded by the soft percussion of cups and spoons. An unfinished screenplay waits beside her coffee."),
        block("character", "MARA"),
        block("parenthetical", "to herself"),
        block("dialogue", "One more page. That’s all. One more page, and then we go."),
        block("action", "The bell above the door rings. ELI steps inside, shaking water from his coat."),
        block("character", "ELI"),
        block("dialogue", "You said that yesterday."),
        block("character", "MARA"),
        block("dialogue", "Yesterday was a different page."),
        block("transition", "CUT TO:"),
        block("sceneHeading", "EXT. COFFEE SHOP - LATER"),
        block("action", "The rain has stopped. Across the street, a café sign flickers to life: Zoë’s. Mara looks up from her notebook."),
    ];
    for _ in 0..15 {
        content.push(block("action", "They walk toward the station. Every window holds a different story, every passerby a character. The morning opens around them, full of things still unwritten."));
    }
    content.push(block("transition", "FADE OUT."));
    let document = json!({"type":"doc", "content":content});
    std::fs::create_dir_all(&output)?;
    let directory = std::path::Path::new(&output);
    std::fs::write(
        directory.join("screenplay.pdf"),
        quill_lib::export::pdf(&document)?,
    )?;
    std::fs::write(
        directory.join("screenplay.fountain"),
        quill_lib::export::fountain(&document)?,
    )?;
    println!(
        "Exported screenplay.pdf and screenplay.fountain to {}",
        directory.display()
    );
    Ok(())
}
