// All application logic lives in the frontend; the Rust side only wires up
// the webview and the plugins it needs (persistent JSON storage, opening
// links in the system browser).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
