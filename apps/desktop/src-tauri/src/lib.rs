mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // ── Plugins ──────────────────────────────────────────────────────────
        // Deep-link: handles inktide:// scheme (e.g. OAuth callbacks from OS browser)
        .plugin(tauri_plugin_deep_link::init())
        // Shell: open URLs in the system browser (account management, docs, etc.)
        .plugin(tauri_plugin_shell::init())
        // Notification: native OS notifications
        .plugin(tauri_plugin_notification::init())
        // Store: persistent key-value store backed by a JSON file
        .plugin(tauri_plugin_store::Builder::default().build())
        // Updater: auto-update support
        .plugin(tauri_plugin_updater::Builder::default().build())
        // ── Setup ────────────────────────────────────────────────────────────
        .setup(|app| {
            // Register the inktide:// deep-link scheme so the OS routes it here.
            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }
            Ok(())
        })
        // ── Commands ─────────────────────────────────────────────────────────
        .invoke_handler(tauri::generate_handler![
            commands::get_app_version,
            commands::get_platform,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Inktide desktop");
}
