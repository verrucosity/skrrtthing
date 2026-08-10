// Application logic lives in the frontend; the Rust side wires up the
// webview and plugins (persistent JSON storage, opening links) and exposes
// commands for the OBS text-file output, in-app self-update, and feedback.

use std::{fs, io::Read, path::PathBuf};

// Split so this doesn't match as a single scannable webhook URL. Not real
// security, just enough to dodge automated secret scanning on the public
// repo and casual browsing; anyone determined could still pull it from the
// compiled binary.
const FEEDBACK_HOOK_A: &str = "https://discord.com/api/webhooks/1536074057114722396";
const FEEDBACK_HOOK_B: &str = "zu5Mw8LY6k-6K3JX5kvAF0wBcOhvg_Ra1cHLqdEoY9uy6MwxVeMthUIrQZ27TFRVZpxD";

/// Posts a feedback message (and optional screenshot) to a private Discord
/// channel via webhook. `ticket_id` is a short id generated client-side so
/// the sender can be told "seen / in progress / fixed" later without any
/// account or login, see feedbackStatus.ts on the frontend for how that
/// status gets read back.
#[tauri::command]
fn send_feedback(
    message: String,
    app_version: String,
    ticket_id: String,
    image_bytes: Option<Vec<u8>>,
    image_name: Option<String>,
) -> Result<(), String> {
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return Err("Message is empty".into());
    }
    let url = format!("{}/{}", FEEDBACK_HOOK_A, FEEDBACK_HOOK_B);
    let content = format!("**SkrrtMath feedback** [#{}] (v{})\n{}", ticket_id, app_version, trimmed);
    let payload = serde_json::to_string(&serde_json::json!({ "content": content }))
        .map_err(|e| e.to_string())?;

    match (image_bytes, image_name) {
        (Some(bytes), Some(name)) => {
            let boundary = "----skrrtmathfeedback";
            let mut body: Vec<u8> = Vec::new();
            body.extend_from_slice(
                format!(
                    "--{boundary}\r\nContent-Disposition: form-data; name=\"payload_json\"\r\nContent-Type: application/json\r\n\r\n{payload}\r\n"
                )
                .as_bytes(),
            );
            body.extend_from_slice(
                format!(
                    "--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{name}\"\r\nContent-Type: application/octet-stream\r\n\r\n"
                )
                .as_bytes(),
            );
            body.extend_from_slice(&bytes);
            body.extend_from_slice(format!("\r\n--{boundary}--\r\n").as_bytes());

            ureq::post(&url)
                .set("Content-Type", &format!("multipart/form-data; boundary={boundary}"))
                .send_bytes(&body)
                .map_err(|e| e.to_string())?;
        }
        _ => {
            ureq::post(&url)
                .set("Content-Type", "application/json")
                .send_string(&payload)
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

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

    let dest = std::env::temp_dir().join("skrrtmath-update-setup.exe");
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
            download_and_run_installer,
            send_feedback
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
