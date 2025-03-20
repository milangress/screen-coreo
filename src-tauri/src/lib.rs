// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod thumbnail;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use serde_json::Value;
use tauri::{
    menu::{MenuBuilder, SubmenuBuilder, PredefinedMenuItem},
    Manager, WebviewWindow, Listener, Emitter,
};

// New Tauri command
#[tauri::command]
fn close_all_windows_force(window: WebviewWindow) {
    let app = window.app_handle();
    let windows = app.webview_windows();
    
    for (window_label, window) in windows.iter() {
        if window_label != "main" {
            window.close().unwrap();
        }
    }
}

// New Tauri command
#[tauri::command]
fn close_all_windows_except_main_prefix(window: WebviewWindow) {
    let app = window.app_handle();
    let windows = app.webview_windows();
    
    for (window_label, window) in windows.iter() {
        if !window_label.starts_with("main") {
            window.close().unwrap();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            close_all_windows_force,
            close_all_windows_except_main_prefix,
            thumbnail::generate_video_thumbnail,
            thumbnail::generate_video_preview
        ])
        .setup(|app| {
            // Create submenus
            let file_submenu = SubmenuBuilder::new(app, "File")
                .text("new", "New")
                .text("open", "Open")
                .text("save", "Save")
                .separator()
                .item(&PredefinedMenuItem::quit(app, None)?)
                .build()?;

            let edit_submenu = SubmenuBuilder::new(app, "Edit")
                .item(&PredefinedMenuItem::undo(app, None)?)
                .item(&PredefinedMenuItem::redo(app, None)?)
                .separator()
                .item(&PredefinedMenuItem::cut(app, None)?)
                .item(&PredefinedMenuItem::copy(app, None)?)
                .item(&PredefinedMenuItem::paste(app, None)?)
                .build()?;

            let view_submenu = SubmenuBuilder::new(app, "View")
                .item(&PredefinedMenuItem::fullscreen(app, None)?)
                .build()?;

            let window_submenu = SubmenuBuilder::new(app, "Window")
                .item(&PredefinedMenuItem::minimize(app, None)?)
                .item(&PredefinedMenuItem::close_window(app, None)?)
                .build()?;

            let help_submenu = SubmenuBuilder::new(app, "Help")
                .text("about", "About")
                .build()?;

            let commands_submenu = SubmenuBuilder::new(app, "Commands")
                .text("next", "Next")
                .separator()
                .text("start", "Start")
                .text("reload", "Reload")
                .separator()
                .text("close_all", "Close All")
                .text("close_all_force", "Close All (Force)")
                .text("close_all_non_main", "Close All (No Main)")
                .separator()
                .text("view_overview", "View Overview")
                .build()?;

            let scroller_submenu = SubmenuBuilder::new(app, "Scroller")
                .text("scroller_open", "Open")
                .text("scroller_focus", "Focus")
                .text("scroller_close", "Close")
                .separator()
                .text("scroller_hide", "Hide")
                .text("scroller_show", "Show")
                .separator()
                .text("scroller_pause", "Pause")
                .text("scroller_scroll_up", "Scroll Up")
                .text("scroller_scroll_down", "Scroll Down")
                .build()?;

            // Build the main menu
            let menu = MenuBuilder::new(app)
                .items(&[
                    &file_submenu,
                    &edit_submenu,
                    &view_submenu,
                    &window_submenu,
                    &help_submenu,
                    &commands_submenu,
                    &scroller_submenu,
                ])
                .build()?;

            app.set_menu(menu)?;

            let handle = app.handle();
            
            handle.listen_any("audio-instance-created", move |event| {
                println!("Audio instance created: {:?}", event.payload());
            });
            
            handle.listen_any("audio-loaded", move |event| {
                println!("Audio loaded: {:?}", event.payload());
            });
            
            handle.listen_any("audio-play", move |event| {
                println!("Audio play: {:?}", event.payload());
            });
            
            handle.listen_any("audio-stop", move |event| {
                println!("Audio stop: {:?}", event.payload());
            });
            
            handle.listen_any("audio-volume-change", move |event| {
                println!("Audio volume change: {:?}", event.payload());
            });
            
            handle.listen_any("set-content", move |event| {
                println!("Set content: {:?}", event.payload());
            });
            
            handle.listen_any("apply-filters", move |event| {
                println!("Apply filters: {:?}", event.payload());
            });
            
            handle.listen_any("window-ready", move |event| {
                println!("Window ready: {:?}", event.payload());
            });
            
            handle.listen_any("code-executed", move |event| {
                println!("Scroller code executed: {:?}", event.payload());
                if let Ok(payload) = serde_json::from_str::<Value>(event.payload().as_ref()) {
                    let success = payload
                        .get("success")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(true);
                    if !success {
                        let error = payload
                            .get("error")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Unknown error");
                        println!("Scroller code evaluation error: {:?}", error);
                    }
                } else {
                    println!("Failed to parse payload as JSON");
                }
            });
            
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .on_menu_event(|app_handle, event| {
            let window = app_handle.get_webview_window("main").unwrap();
            match event.id().0.as_str() {
                "close_all_force" => {
                    close_all_windows_force(window.clone());
                    window.emit_to("main", "menu-event", "close_all").unwrap();
                }
                "close_all_non_main" => {
                    close_all_windows_except_main_prefix(window.clone());
                    window.emit_to("main", "menu-event", "close_all_non_main").unwrap();
                }
                _ => {
                    window.emit_to("main", "menu-event", event.id().0.clone()).unwrap();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
