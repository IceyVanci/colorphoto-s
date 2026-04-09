// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::io::BufReader;
use std::path::Path;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Serialize, Deserialize)]
struct FileResult {
    path: Option<String>,
    data: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SaveResult {
    success: bool,
    path: Option<String>,
    canceled: bool,
    error: Option<String>,
}

/// 打开文件对话框并读取选中的 JPEG 文件
#[tauri::command]
async fn open_file_dialog(app: AppHandle) -> Result<FileResult, String> {
    let file_path = app.dialog()
        .file()
        .add_filter("图片文件", &["jpg", "jpeg", "png", "webp", "gif", "bmp"])
        .blocking_pick_file();
    
    if let Some(path) = file_path {
        let path_str = path.to_string();
        // 读取文件数据
        if let Ok(data) = fs::read(&path_str) {
            use base64::Engine;
            let base64_data = base64::engine::general_purpose::STANDARD.encode(&data);
            let data_url = format!("data:image/jpeg;base64,{}", base64_data);
            return Ok(FileResult {
                path: Some(path_str),
                data: Some(data_url),
            });
        } else {
            return Err("无法读取文件".to_string());
        }
    }
    
    Ok(FileResult {
        path: None,
        data: None,
    })
}

/// 保存文件到指定路径
#[tauri::command]
async fn save_file(app: AppHandle, data: String, default_path: String) -> Result<SaveResult, String> {
    let file_path = app.dialog()
        .file()
        .set_file_name(&default_path)
        .add_filter("JPEG 图片", &["jpg", "jpeg"])
        .blocking_save_file();
    
    if let Some(path) = file_path {
        let path_str = path.to_string();
        
        // 移除 data URL 前缀
        let base64_data = data
            .strip_prefix("data:image/jpeg;base64,")
            .or_else(|| data.strip_prefix("data:image/jpg;base64,"))
            .unwrap_or(&data);

        // 解码 base64
        use base64::Engine;
        match base64::engine::general_purpose::STANDARD.decode(base64_data) {
            Ok(bytes) => {
                match fs::write(&path_str, bytes) {
                    Ok(_) => {
                        return Ok(SaveResult {
                            success: true,
                            path: Some(path_str),
                            canceled: false,
                            error: None,
                        });
                    }
                    Err(e) => {
                        return Ok(SaveResult {
                            success: false,
                            path: None,
                            canceled: false,
                            error: Some(format!("写入文件失败: {}", e)),
                        });
                    }
                }
            }
            Err(e) => {
                return Ok(SaveResult {
                    success: false,
                    path: None,
                    canceled: false,
                    error: Some(format!("Base64 解码失败: {}", e)),
                });
            }
        }
    } else {
        return Ok(SaveResult {
            success: false,
            path: None,
            canceled: true,
            error: None,
        });
    }
}

/// 读取 JPEG 文件的 EXIF 信息
#[tauri::command]
async fn get_exif(file_path: String) -> Result<Option<serde_json::Value>, String> {
    let path = Path::new(&file_path);
    
    if !path.exists() {
        return Err(format!("文件不存在: {}", file_path));
    }

    let file = fs::File::open(path)
        .map_err(|e| format!("无法打开文件: {}", e))?;
    
    let mut bufreader = BufReader::new(&file);
    
    match exif::Reader::new().read_from_container(&mut bufreader) {
        Ok(exif) => {
            let mut json_map = serde_json::Map::new();
            
            for field in exif.fields() {
                let tag_name = format!("{}", field.tag);
                let value = format!("{}", field.display_value());
                json_map.insert(tag_name, serde_json::Value::String(value));
            }
            
            Ok(Some(serde_json::Value::Object(json_map)))
        }
        Err(_) => {
            Ok(None)
        }
    }
}

fn main() {
    env_logger::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            save_file,
            get_exif
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
