import { db } from '../../database/db'; // Import instance Dexie của bạn
import { format } from 'date-fns'; // Hoặc dùng native Date nếu chưa cài date-fns

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    [tableName: string]: any[];
  };
}

// 1. EXPORT: Lấy toàn bộ dữ liệu ra JSON
export const exportData = async (): Promise<void> => {
  try {
    const allTables = db.tables;
    const data: any = {};

    // Lặp qua từng bảng để lấy dữ liệu
    for (const table of allTables) {
      data[table.name] = await table.toArray();
    }

    const backup: BackupData = {
      version: '3.5', // Theo version hiện tại
      timestamp: new Date().toISOString(),
      data: data,
    };

    // Tạo Blob và trigger download
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindcap_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Export Failed:", error);
    throw new Error("Không thể tạo file backup.");
  }
};

// 2. IMPORT: Đọc file JSON và ghi đè vào DB
export const importData = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonContent = e.target?.result as string;
        if (!jsonContent) throw new Error("File rỗng");

        const backup: BackupData = JSON.parse(jsonContent);

        // Validation cơ bản
        if (!backup.data || !backup.version) {
          throw new Error("File backup không hợp lệ");
        }

        // Transaction: Xóa cũ -> Ghi mới (Atomic)
        await db.transaction('rw', db.tables, async () => {
          // Xóa dữ liệu hiện tại (Nguy hiểm nhưng cần thiết để tránh trùng ID)
          // Nếu muốn an toàn hơn, có thể thêm logic "Merge", nhưng "Replace" sạch sẽ hơn cho Backup.
          for (const table of db.tables) {
            await table.clear(); 
          }

          // Nhập dữ liệu mới
          const tableNames = Object.keys(backup.data);
          for (const tableName of tableNames) {
            const table = db.table(tableName);
            if (table) {
              await table.bulkAdd(backup.data[tableName]);
            }
          }
        });

        resolve();
      } catch (error) {
        console.error("Import Failed:", error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsText(file);
  });
};