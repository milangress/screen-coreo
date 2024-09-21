// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use tauri::{CustomMenuItem, Menu, Submenu, MenuItem, Manager, Window};

// New Tauri command
#[tauri::command]
fn close_all_windows_except_main(window: Window) {
    let app = window.app_handle();
    let windows = app.windows();
    
    for (window_label, window) in windows.iter() {
        if window_label != "main" {
            window.close().unwrap();
        }
    }
}

fn main() {
    // Custom menu items
    let start = CustomMenuItem::new("start".to_string(), "Start");
    let reload = CustomMenuItem::new("reload".to_string(), "Reload This");
    let close_all = CustomMenuItem::new("close_all".to_string(), "Close All");
    let close_all_force = CustomMenuItem::new("close_all_force".to_string(), "Close All (Force)");
    let next = CustomMenuItem::new("next".to_string(), "Next");
    let view_overview = CustomMenuItem::new("view_overview".to_string(), "View Overview");
  
    // Commands submenu (custom)
    let commands = Submenu::new("Commands", Menu::new()
        .add_item(next)
        .add_native_item(MenuItem::Separator)
        .add_item(start)
        .add_item(reload)
        .add_native_item(MenuItem::Separator)
        .add_item(close_all)
        .add_item(close_all_force)
        .add_native_item(MenuItem::Separator)
        .add_item(view_overview)
    );
  
    // Default menu items
    let file_menu = Submenu::new("File", Menu::new()
        .add_item(CustomMenuItem::new("new", "New"))
        .add_item(CustomMenuItem::new("open", "Open"))
        .add_item(CustomMenuItem::new("save", "Save"))
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Quit)
    );

    let edit_menu = Submenu::new("Edit", Menu::new()
        .add_native_item(MenuItem::Undo)
        .add_native_item(MenuItem::Redo)
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Cut)
        .add_native_item(MenuItem::Copy)
        .add_native_item(MenuItem::Paste)
    );

    let view_menu = Submenu::new("View", Menu::new()
        .add_native_item(MenuItem::EnterFullScreen)
    );

    // Combine default and custom menus
    let menu = Menu::new()
        .add_submenu(file_menu)
        .add_submenu(edit_menu)
        .add_submenu(view_menu)
        .add_submenu(commands)
        .add_submenu(Submenu::new("Window", Menu::new()
            .add_native_item(MenuItem::Minimize)
            .add_native_item(MenuItem::CloseWindow)
        ))
        .add_submenu(Submenu::new("Help", Menu::new()
            .add_item(CustomMenuItem::new("about", "About"))
        ));
  
    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| {
            match event.menu_item_id() {
                "close_all_force" => {
                    let window = event.window();
                    close_all_windows_except_main(window.clone());
                    event.window().emit("menu-event", "close_all").unwrap();
                },
                _ => {
                    event.window().emit("menu-event", event.menu_item_id()).unwrap();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![close_all_windows_except_main])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
