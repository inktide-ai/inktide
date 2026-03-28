// Prevents an additional console window on Windows in release builds.
// DO NOT REMOVE this attribute.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    chimera_desktop_lib::run()
}
