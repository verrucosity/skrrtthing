// Application logic lives in the frontend; the Rust side wires up the
// webview and plugins (persistent JSON storage, opening links) and exposes
// commands for the OBS text-file output and in-app self-update.

use std::{fs, io::Read, path::PathBuf};

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

/// Downloads the NSIS setup .exe from the given URL into a temp file and
/// launches it, then quits this app so the installer can overwrite the
/// running executable in place (same install location every time, so it's
/// always an upgrade, never a second side-by-side install).
#[tauri::command]
fn download_and_run_installer(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let resp = ureq::get(&url).call().map_err(|e| e.to_string())?;
    let mut bytes: Vec<u8> = Vec::new();
    resp.into_reader()
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;

    let dest = std::env::temp_dir().join("skrrt-goal-thingy-update-setup.exe");
    fs::write(&dest, &bytes).map_err(|e| e.to_string())?;

    std::process::Command::new(&dest)
        .spawn()
        .map_err(|e| e.to_string())?;

    app.exit(0);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            write_text_file,
            download_and_run_installer
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
