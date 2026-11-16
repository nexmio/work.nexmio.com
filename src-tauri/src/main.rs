// Prevents an extra console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Nexmio Work started again as the Foundry Local helper: no window, no Tauri.
    if let Some(code) = nexmio_work_lib::foundry::helper::maybe_run() {
        std::process::exit(code);
    }
    nexmio_work_lib::run()
}
