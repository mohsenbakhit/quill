//! Pipe a .quill document into this example and write the exported bytes to stdout.
//! cargo run --example export_document -- fountain < screenplay.quill > screenplay.fountain
use std::io::{Read, Write};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let format = std::env::args().nth(1).ok_or("Choose pdf or fountain")?;
    let mut input = String::new();
    std::io::stdin()
        .take(11 * 1024 * 1024)
        .read_to_string(&mut input)?;
    let document = serde_json::from_str(&input)?;
    let output = match format.as_str() {
        "pdf" => quill_lib::export::pdf(&document)?,
        "fountain" => quill_lib::export::fountain(&document)?.into_bytes(),
        _ => return Err("Choose pdf or fountain".into()),
    };
    std::io::stdout().write_all(&output)?;
    Ok(())
}
