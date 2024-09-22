// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use tauri::{CustomMenuItem, Menu, Submenu, MenuItem, Manager, Window};

// New Tauri command
#[tauri::command]
fn close_all_windows_force(window: Window) {
    let app = window.app_handle();
    let windows = app.windows();
    
    for (window_label, window) in windows.iter() {
        if window_label != "main" {
            window.close().unwrap();
        }
    }
}

// New Tauri command
#[tauri::command]
fn close_all_windows_except_main_prefix(window: Window) {
    let app = window.app_handle();
    let windows = app.windows();
    
    for (window_label, window) in windows.iter() {
        if !window_label.starts_with("main") {
            window.close().unwrap();
        }
    }
}

fn main() {
    // Custom menu items
    let start = CustomMenuItem::new("start".to_string(), "Start");
    let reload = CustomMenuItem::new("reload".to_string(), "Reload This");
    let close_all = CustomMenuItem::new("close_all".to_string(), "Close All");
    let close_all_non_main = CustomMenuItem::new("close_all_non_main".to_string(), "Close All (No Main)");
    let close_all_force = CustomMenuItem::new("close_all_force".to_string(), "Close All (Force)");
    let next = CustomMenuItem::new("next".to_string(), "Next");
    let view_overview = CustomMenuItem::new("view_overview".to_string(), "View Overview");
  
    let scroller_open = CustomMenuItem::new("scroller_open".to_string(), "Open");
    let scroller_focus = CustomMenuItem::new("scroller_focus".to_string(), "Focus");
    let scroller_close = CustomMenuItem::new("scroller_close".to_string(), "Close");
    let scroller_hide = CustomMenuItem::new("scroller_hide".to_string(), "Hide");
    let scroller_show = CustomMenuItem::new("scroller_show".to_string(), "Show");
    let scroller_pause = CustomMenuItem::new("scroller_pause".to_string(), "Pause");
    let scroller_scroll_up = CustomMenuItem::new("scroller_scroll_up".to_string(), "Scroll Up");
    let scroller_scroll_down = CustomMenuItem::new("scroller_scroll_down".to_string(), "Scroll Down");
    // Commands submenu (custom)
    let commands = Submenu::new("Commands", Menu::new()
        .add_item(next)
        .add_native_item(MenuItem::Separator)
        .add_item(start)
        .add_item(reload)
        .add_native_item(MenuItem::Separator)
        .add_item(close_all)
        .add_item(close_all_force)
        .add_item(close_all_non_main)
        .add_native_item(MenuItem::Separator)
        .add_item(view_overview)
    );

    let scroller_menu = Submenu::new("Scroller", Menu::new()
        .add_item(scroller_open)
        .add_item(scroller_focus)
        .add_item(scroller_close)
        .add_native_item(MenuItem::Separator)
        .add_item(scroller_hide)
        .add_item(scroller_show)
        .add_native_item(MenuItem::Separator)
        .add_item(scroller_pause)
        .add_item(scroller_scroll_up)
        .add_item(scroller_scroll_down)
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
        .add_submenu(Submenu::new("Window", Menu::new()
            .add_native_item(MenuItem::Minimize)
            .add_native_item(MenuItem::CloseWindow)
        ))
        .add_submenu(Submenu::new("Help", Menu::new()
            .add_item(CustomMenuItem::new("about", "About"))
        ))
        .add_submenu(commands)
        .add_submenu(scroller_menu);
  
    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| {
            match event.menu_item_id() {
                "close_all_force" => {
                    let window = event.window();
                    close_all_windows_force(window.clone());
                    event.window().emit("menu-event", "close_all").unwrap();
                },
                "close_all_non_main" => {
                    let window = event.window();
                    close_all_windows_except_main_prefix(window.clone());
                    event.window().emit("menu-event", "close_all_non_main").unwrap();
                },
                _ => {
                    event.window().emit("menu-event", event.menu_item_id()).unwrap();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            close_all_windows_force,
            close_all_windows_except_main_prefix
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
