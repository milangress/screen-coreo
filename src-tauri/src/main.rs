// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

fn main() {
    let start = CustomMenuItem::new("start".to_string(), "Start");
    let reload = CustomMenuItem::new("reload".to_string(), "Reload This");
    let close_all = CustomMenuItem::new("close_all".to_string(), "Close All");
    let next = CustomMenuItem::new("next".to_string(), "Next");
    let view_overview = CustomMenuItem::new("view_overview".to_string(), "View Overview");

    let commands = Submenu::new("Commands", Menu::new()
        .add_item(start)
        .add_item(reload)
        .add_item(close_all)
        .add_item(next)
        .add_item(view_overview)
    );

    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_submenu(commands);

    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| {
            event.window().emit("menu-event", event.menu_item_id()).unwrap();
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
