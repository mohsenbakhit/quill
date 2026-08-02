// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod pdf;
mod screenplay;
use printpdf::{Mm, Pt};
use screenplay::Block;

use crate::pdf::move_down;

const PAGE_WIDTH: Mm = Mm(215.9); // US Letter page dimensions
const PAGE_HEIGHT: Mm = Mm(279.4);

const LEFT_MARGIN: Mm = Mm(38.1); // 1.5 inches
const RIGHT_MARGIN: Mm = Mm(25.4); // 1 inch
const TOP_MARGIN: Mm = Mm(25.4);
const BOTTOM_MARGIN: Mm = Mm(25.4);

const FONT_SIZE: Pt = Pt(12.0);
const LINE_HEIGHT: Pt = Pt(12.0);

const ACTION_X: Mm = LEFT_MARGIN;

// Margins from the left for different elements in the script
const CHARACTER_X: Mm = Mm(93.98);
const DIALOGUE_X: Mm = Mm(63.5);
const PARENTHETICAL_X: Mm = Mm(78.74);
const TRANSITION_X: Mm = Mm(152.4);

#[tauri::command]
async fn export_to_pdf(screenplay: Vec<Block>) {
    let line_height_mm: Mm = LINE_HEIGHT.into();

    let mut cur_y = PAGE_HEIGHT - TOP_MARGIN;
    println!("{:?}", screenplay);
    for block in screenplay {
        match block {
            Block::Scene { text } => {
                println!("({:.1}, {:.1}) Scene: {}", LEFT_MARGIN.0, cur_y.0, text);

                move_down(&mut cur_y, line_height_mm);
                move_down(&mut cur_y, line_height_mm); // blank line
            }

            Block::Action { text } => {
                println!("({:.1}, {:.1}) Action: {}", ACTION_X.0, cur_y.0, text);

                move_down(&mut cur_y, line_height_mm);
                move_down(&mut cur_y, line_height_mm); // blank line
            }

            Block::Character { text } => {
                println!("({:.1}, {:.1}) Character: {}", CHARACTER_X.0, cur_y.0, text);

                move_down(&mut cur_y, line_height_mm);
            }

            Block::Dialogue { text } => {
                println!("({:.1}, {:.1}) Dialogue: {}", DIALOGUE_X.0, cur_y.0, text);

                move_down(&mut cur_y, line_height_mm);
                move_down(&mut cur_y, line_height_mm); // blank line
            }

            Block::Parenthetical { text } => {
                println!(
                    "({:.1}, {:.1}) Parenthetical: {}",
                    PARENTHETICAL_X.0, cur_y.0, text
                );

                move_down(&mut cur_y, line_height_mm);
            }

            Block::Transition { text } => {
                println!(
                    "({:.1}, {:.1}) Transition: {}",
                    TRANSITION_X.0, cur_y.0, text
                );

                move_down(&mut cur_y, line_height_mm);
                move_down(&mut cur_y, line_height_mm); // blank line
            }
        }
    }
    // pdf::export(screenplay)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![export_to_pdf,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
