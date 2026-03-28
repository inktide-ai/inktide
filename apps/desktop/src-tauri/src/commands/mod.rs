/// Returns the application version from Cargo.toml.
/// Callable from the renderer via: invoke('get_app_version')
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Returns the current OS platform string.
/// Callable from the renderer via: invoke('get_platform')
#[tauri::command]
pub fn get_platform() -> &'static str {
    std::env::consts::OS
}
