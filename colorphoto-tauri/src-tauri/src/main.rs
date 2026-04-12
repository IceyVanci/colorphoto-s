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

/// 从 JPEG 数据中提取 EXIF 段（原始二进制）
fn extract_exif_from_jpeg(jpeg_data: &[u8]) -> Option<Vec<u8>> {
    // JPEG 格式: SOI (0xFF 0xD8) + 段...
    if jpeg_data.len() < 4 || jpeg_data[0] != 0xFF || jpeg_data[1] != 0xD8 {
        return None;
    }
    
    let mut i = 2; // 跳过 SOI
    while i < jpeg_data.len() - 1 {
        if jpeg_data[i] != 0xFF {
            break;
        }
        
        let marker = jpeg_data[i + 1];
        
        // EOI (End of Image)
        if marker == 0xD9 {
            break;
        }
        
        // SOI 或 RST 标记
        if marker == 0xD8 || (marker >= 0xD0 && marker <= 0xD7) {
            i += 2;
            continue;
        }
        
        // 其他标记需要长度字段
        if i + 3 >= jpeg_data.len() {
            break;
        }
        
        let len = ((jpeg_data[i + 2] as usize) << 8) | (jpeg_data[i + 3] as usize);
        let segment_len = len + 2;
        
        if i + segment_len > jpeg_data.len() {
            break;
        }
        
        // APP1 (EXIF) 标记是 0xE1
        if marker == 0xE1 {
            // 检查是否是 EXIF ("Exif\0\0")
            let segment_data = &jpeg_data[i + 4..i + segment_len];
            if segment_data.len() >= 6 && &segment_data[0..6] == b"Exif\0\0" {
                // 提取 EXIF 内容（不包括 "Exif\0\0" 头）
                let exif_content = segment_data[6..].to_vec();
                if !exif_content.is_empty() {
                    return Some(exif_content);
                }
            }
        }
        
        i += segment_len;
    }
    
    None
}

/// 将 EXIF 段插入到 JPEG 数据中
fn insert_exif_into_jpeg(jpeg_data: &[u8], exif_data: &[u8]) -> Vec<u8> {
    if exif_data.is_empty() {
        return jpeg_data.to_vec();
    }
    
    let mut result: Vec<u8> = Vec::with_capacity(jpeg_data.len() + exif_data.len() + 100);
    
    // 找到 JPEG 开始 (SOI: 0xFF 0xD8)
    if jpeg_data.len() >= 2 && jpeg_data[0] == 0xFF && jpeg_data[1] == 0xD8 {
        result.push(0xFF);
        result.push(0xD8);
        
        // 跳过原始的 APP1 段
        let mut i = 2;
        while i < jpeg_data.len() - 1 {
            if jpeg_data[i] == 0xFF && jpeg_data[i+1] != 0x00 && jpeg_data[i+1] != 0xFF && jpeg_data[i+1] != 0xD8 && jpeg_data[i+1] != 0xD9 {
                let marker = jpeg_data[i+1];
                let is_app1 = marker == 0xE1;
                
                if jpeg_data[i+1] >= 0xE0 && jpeg_data[i+1] <= 0xEF {
                    // 读取段长度
                    if i + 3 < jpeg_data.len() {
                        let len = ((jpeg_data[i+2] as usize) << 8) | (jpeg_data[i+3] as usize);
                        let segment_len = len + 2;
                        
                        if i + segment_len <= jpeg_data.len() {
                            if !is_app1 {
                                // 复制非 APP1 段
                                result.extend_from_slice(&jpeg_data[i..i+segment_len]);
                            }
                            i += segment_len;
                            continue;
                        }
                    }
                }
            }
            break;
        }
        
        // 插入新的 EXIF APP1 段
        // EXIF 标记: FF E1
        // 长度字段 (2 bytes) + "Exif\0\0" + EXIF 数据
        result.push(0xFF);
        result.push(0xE1);
        
        let exif_header = b"Exif\0\0";
        let total_len = 2 + exif_header.len() + exif_data.len();
        result.push((total_len >> 8) as u8);
        result.push((total_len & 0xFF) as u8);
        result.extend_from_slice(exif_header);
        result.extend_from_slice(exif_data);
        
        // 添加剩余的原始数据
        result.extend_from_slice(&jpeg_data[i..]);
        
        return result;
    } else {
        // 如果不是有效的 JPEG，返回原始数据
        jpeg_data.to_vec()
    }
}

/// 保存文件并保留 EXIF 信息
#[tauri::command]
async fn save_file_with_exif(
    app: AppHandle, 
    data: String, 
    original_file_path: String,
    default_path: String
) -> Result<SaveResult, String> {
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
            Ok(mut image_data) => {
                // 尝试从原始文件提取 EXIF
                if let Ok(original_data) = fs::read(&original_file_path) {
                    if let Some(exif_data) = extract_exif_from_jpeg(&original_data) {
                        image_data = insert_exif_into_jpeg(&image_data, &exif_data);
                        log::info!("EXIF embedded successfully");
                    }
                }
                
                match fs::write(&path_str, &image_data) {
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

fn main() {
    env_logger::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            save_file,
            save_file_with_exif,
            get_exif
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
