// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod pdf;
mod screenplay;
use screenplay::Block;

#[tauri::command]
async fn export_to_pdf(screenplay: Vec<Block>, output_path: String) -> Result<(), String> {
    pdf::export(screenplay, std::path::Path::new(&output_path)).map_err(|error| error.to_string())
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
