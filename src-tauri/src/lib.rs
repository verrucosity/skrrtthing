// Application logic lives in the frontend; the Rust side wires up the
// webview and plugins (persistent JSON storage, opening links) and exposes
// one command for the OBS text-file output.

use std::{fs, path::PathBuf};

/// Write the goal text to a user-chosen file so OBS can read it with a
/// Text source. Creates missing parent directories.
#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    fs::write(&path, contents).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![write_text_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
