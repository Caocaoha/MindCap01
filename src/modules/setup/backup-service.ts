// src/modules/setup/backup-service.ts
import { db } from '../../database/db';

export interface BackupData {
  version: string;
  timestamp: string;
  data: { [tableName: string]: any[] };
}

/**
 * CORE: Chỉ lấy dữ liệu thô (Raw Data)
 * Dùng cho cả Download Local và Upload Drive
 */
export const generateBackupData = async (): Promise<BackupData> => {
  const allTables = db.tables;
  const data: any = {};

  for (const table of allTables) {
    data[table.name] = await table.toArray();
  }

  return {
    version: '3.6', // Mind Cap v3.6
    timestamp: new Date().toISOString(),
    data: data,
  };
};

/**
 * ACTION: Tải file .json về máy (Local Download)
 */
export const downloadBackupFile = async () => {
  try {
    const backup = await generateBackupData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindcap_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export Local Failed:", error);
    throw new Error("Không thể tạo file backup.");
  }
};

/**
 * CORE: Nhập dữ liệu từ Object (Dùng cho cả Local File và Drive)
 */
export const restoreFromData = async (backup: BackupData): Promise<void> => {
  if (!backup.data || !backup.version) {
    throw new Error("Cấu trúc file backup không hợp lệ.");
  }

  await db.transaction('rw', db.tables, async () => {
    // 1. Xóa sạch dữ liệu cũ (Reset)
    for (const table of db.tables) {
      await table.clear(); 
    }
    
    // 2. Nạp dữ liệu mới
    const tableNames = Object.keys(backup.data);
    for (const tableName of tableNames) {
      const table = db.table(tableName);
      if (table) {
        await table.bulkAdd(backup.data[tableName]);
      }
    }
  });
};

/**
 * ACTION: Đọc file từ input (Local Import)
 */
export const parseBackupFile = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonContent = e.target?.result as string;
        if (!jsonContent) throw new Error("File rỗng");
        const backup: BackupData = JSON.parse(jsonContent);
        await restoreFromData(backup);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsText(file);
  });
};