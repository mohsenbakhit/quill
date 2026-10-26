pub mod export;

#[tauri::command]
fn export_fountain(document: serde_json::Value) -> Result<String, String> {
    export::fountain(&document)
}

#[tauri::command]
fn export_pdf(document: serde_json::Value) -> Result<Vec<u8>, String> {
    export::pdf(&document)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![export_fountain, export_pdf])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
